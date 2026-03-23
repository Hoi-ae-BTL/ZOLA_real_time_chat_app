from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from backend.app import crud, schemas
from backend.app.db.base import User, Conversation


async def create_conversation(
    db: AsyncSession, *, creator: User, conversation_in: schemas.ConversationCreate
) -> Conversation:
    """
    Handles the business logic for creating a new conversation.
    - Validates user IDs.
    - Enforces rules for direct and group conversations.
    - Prevents duplicate direct conversations.
    - Creates the conversation and adds participants.
    """
    # 1. Validate that all user IDs from the request exist
    all_user_ids = list(set(conversation_in.user_ids))
    if all_user_ids:  # Only query if there are users to check
        users = await crud.crud_user.get_users_by_ids(db, user_ids=all_user_ids)
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
        # Check for and return existing direct conversation
        existing_conversation = await crud.crud_conversation.get_direct_conversation_by_users(
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
    conversation = await crud.crud_conversation.create_conversation(
        db=db, conversation_in=conversation_in, creator_id=creator.id
    )
    return conversation


async def get_and_validate_conversation(
    db: AsyncSession, *, conversation_id: str, user: User
) -> Conversation:
    """
    Fetches a conversation and validates that the user is a member.
    """
    conversation = await crud.crud_conversation.get_conversation_by_id(
        db=db, conversation_id=conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )

    # Check if the current user is a participant
    if not any(p.id == user.id for p in conversation.participants):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation.",
        )
    return conversation
