from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from typing import List

from backend.app.crud import (
    crud_user,
    crud_conversation
)
from backend.app.schemas.conversation import (
    ConversationCreate,
    ConversationUpdate
)
from backend.app.db.base import User, Conversation, ConversationType  # Import the correct Enum
from backend.app.crud import crud_message
from backend.app.websockets.socket_manager import (
    build_event,
    connection_manager,
    serialize_conversation,
)


async def create_conversation(
    db: AsyncSession, *, creator: User, conversation_in: ConversationCreate
) -> Conversation:
    # 1. Validate that all user IDs from the request exist
    all_user_ids = list(set(conversation_in.user_ids))
    if all_user_ids:
        users = await crud_user.get_users_by_ids(db, user_ids=all_user_ids)
        if len(users) != len(all_user_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more user IDs are invalid.",
            )

    # 2. Apply logic specific to conversation type
    if conversation_in.type == "direct":
        if len(conversation_in.user_ids) != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Direct conversations must have exactly one other participant.",
            )
        other_user_id = conversation_in.user_ids[0]
        if other_user_id == creator.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot create a direct conversation with yourself.",
            )
        existing_conversation = await crud_conversation.get_direct_conversation_by_users(
            db=db, user1_id=creator.id, user2_id=other_user_id
        )
        if existing_conversation:
            return existing_conversation

    elif conversation_in.type == "group":
        if not conversation_in.group_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group name is required for group conversations.",
            )
        if len(conversation_in.user_ids) < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group conversations must have at least one other participant.",
            )

    # 3. If all checks pass, create the conversation
    conversation = await crud_conversation.create_conversation(
        db=db, conversation_in=conversation_in, creator_id=creator.id
    )
    await connection_manager.emit_to_users(
        [participant.id for participant in conversation.participants],
        build_event(
            "conversation_created",
            conversation_id=conversation.id,
            data=serialize_conversation(conversation),
        ),
    )
    return conversation


async def get_and_validate_conversation(
    db: AsyncSession, *, conversation_id: str, user: User, check_admin: bool = False
) -> Conversation:
    """
    Fetches a conversation, validates the user is a member, and optionally checks for admin rights.
    """
    conversation = await crud_conversation.get_conversation_by_id(
        db=db, conversation_id=conversation_id
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    if not any(p.id == user.id for p in conversation.participants):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this conversation.")
    if check_admin and conversation.group_created_by != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have admin rights for this group.")
    return conversation


async def update_group_conversation(
    db: AsyncSession, *, conversation_id: str, conversation_in: ConversationUpdate, user: User
) -> Conversation:
    """Updates a group conversation's details (e.g., name)."""
    conversation = await get_and_validate_conversation(db=db, conversation_id=conversation_id, user=user, check_admin=True)
    if conversation.type != ConversationType.group:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This is not a group conversation.")
    updated_conversation = await crud_conversation.update_conversation(
        db=db, conversation=conversation, conversation_in=conversation_in
    )
    await connection_manager.emit_to_users(
        [participant.id for participant in updated_conversation.participants],
        build_event(
            "conversation_updated",
            conversation_id=updated_conversation.id,
            data=serialize_conversation(updated_conversation),
        ),
    )
    return updated_conversation


async def add_members(
    db: AsyncSession, *, conversation_id: str, member_ids_in: List[str], user: User
) -> Conversation:
    """Adds members to a group conversation."""
    conversation = await get_and_validate_conversation(db=db, conversation_id=conversation_id, user=user, check_admin=True)
    if conversation.type != ConversationType.group:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This is not a group conversation.")

    existing_member_ids = {p.id for p in conversation.participants}
    new_member_ids = set(member_ids_in)

    if not new_member_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No members to add.")

    if new_member_ids & existing_member_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more users are already in the group.")

    users = await crud_user.get_users_by_ids(db, user_ids=list(new_member_ids))
    if len(users) != len(new_member_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more users not found.")

    updated_conversation = await crud_conversation.add_members_to_conversation(
        db=db, conversation=conversation, user_ids=list(new_member_ids)
    )
    await connection_manager.emit_to_users(
        [participant.id for participant in updated_conversation.participants],
        build_event(
            "conversation_members_added",
            conversation_id=updated_conversation.id,
            data={
                "conversation": serialize_conversation(updated_conversation),
                "user_ids": list(new_member_ids),
            },
        ),
    )
    return updated_conversation


async def remove_member(
    db: AsyncSession, *, conversation_id: str, member_id_to_remove: str, current_user: User
):
    """Removes a member from a group or allows a user to leave."""
    conversation = await get_and_validate_conversation(db=db, conversation_id=conversation_id, user=current_user)
    if conversation.type != ConversationType.group:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This is not a group conversation.")

    is_admin = conversation.group_created_by == current_user.id
    is_self_removal = member_id_to_remove == current_user.id

    if not is_admin and not is_self_removal:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only remove yourself or be removed by an admin.")

    if not any(p.id == member_id_to_remove for p in conversation.participants):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this conversation.")

    participant_ids_before = [participant.id for participant in conversation.participants]
    await crud_conversation.remove_member_from_conversation(
        db=db, conversation_id=conversation_id, user_id=member_id_to_remove
    )
    await connection_manager.emit_to_users(
        participant_ids_before,
        build_event(
            "conversation_member_removed",
            conversation_id=conversation_id,
            data={
                "user_id": member_id_to_remove,
            },
        ),
    )
    return


async def hide_conversation(
    db: AsyncSession, *, conversation_id: str, current_user: User
):
    """Hides a direct conversation for the current user."""
    conversation = await get_and_validate_conversation(db=db, conversation_id=conversation_id, user=current_user)
    if conversation.type != ConversationType.direct:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only direct conversations can be hidden.")
    
    await crud_conversation.hide_conversation(db=db, conversation_id=conversation_id, user_id=current_user.id)
    await connection_manager.emit_to_users(
        [current_user.id],
        build_event(
            "conversation_hidden",
            conversation_id=conversation_id,
            data={"user_id": current_user.id},
        ),
    )
    return


async def mark_conversation_seen(
    db: AsyncSession, *, conversation_id: str, current_user: User
) -> dict:
    conversation = await get_and_validate_conversation(
        db=db, conversation_id=conversation_id, user=current_user
    )
    seen_at = await crud_conversation.mark_conversation_seen(
        db=db, conversation_id=conversation_id, user_id=current_user.id
    )
    latest_message = await crud_message.get_latest_message_by_conversation(
        db=db, conversation_id=conversation_id
    )
    payload = {
        "conversation_id": conversation_id,
        "user_id": current_user.id,
        "seen_at": seen_at.isoformat(),
        "last_message_id": latest_message.id if latest_message else None,
    }
    await connection_manager.emit_to_users(
        [participant.id for participant in conversation.participants],
        build_event(
            "message_read",
            conversation_id=conversation_id,
            data=payload,
        ),
    )
    return payload
