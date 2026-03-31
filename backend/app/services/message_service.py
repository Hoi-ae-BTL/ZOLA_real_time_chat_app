from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from typing import List

from backend.app.services import conversation_service
from backend.app.crud import crud_message, crud_conversation
from backend.app.schemas.message import MessageCreate, MessageUpdate
from backend.app.db.base import User, Message
from backend.app.websockets.broker import event_broker
from backend.app.websockets.socket_manager import (
    build_event,
    connection_manager,
    serialize_message,
)


async def create_message(
    db: AsyncSession, *, message_in: MessageCreate, sender: User
) -> Message:
    """
    Creates a new message.
    """
    conversation = await crud_conversation.get_conversation_by_id(
        db, conversation_id=message_in.conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found."
        )
    if not any(p.id == sender.id for p in conversation.participants):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation.",
        )

    message = await crud_message.create_message(
        db=db, message_in=message_in, sender_id=sender.id
    )
    participant_ids = [participant.id for participant in conversation.participants]
    await connection_manager.emit_to_users(
        participant_ids,
        build_event(
            "message_created",
            conversation_id=message.conversation_id,
            data=serialize_message(message),
        ),
    )

    if message.img_url or message.file_url:
        await connection_manager.emit_to_users(
            participant_ids,
            build_event(
                "attachment_uploaded",
                conversation_id=message.conversation_id,
                data=serialize_message(message),
            ),
        )

    online_participant_ids = connection_manager.get_connected_user_ids(participant_ids)
    if event_broker.enabled:
        online_participant_ids = await event_broker.get_online_user_ids(participant_ids)

    delivered_to = [user_id for user_id in online_participant_ids if user_id != sender.id]
    if delivered_to:
        await connection_manager.emit_to_users(
            [sender.id],
            build_event(
                "message_delivered",
                conversation_id=message.conversation_id,
                data={
                    "message_id": message.id,
                    "delivered_to": delivered_to,
                },
            ),
        )
    return message


async def get_messages_for_conversation(
        db: AsyncSession, *, conversation_id: str, user: User, skip: int, limit: int
) -> list[Message]:
    """
    Handles the business logic for getting conversation messages.
    """
    await conversation_service.get_and_validate_conversation(
        db=db, conversation_id=conversation_id, user=user
    )
    messages = await crud_message.get_messages_by_conversation(
        db=db, conversation_id=conversation_id, skip=skip, limit=limit
    )
    return messages[::-1]

async def get_conversation_media(
        db: AsyncSession, *, conversation_id: str, user: User, skip: int, limit: int
) -> list[Message]:
    """
    Handles the business logic for getting conversation media.
    """
    await conversation_service.get_and_validate_conversation(
        db=db, conversation_id=conversation_id, user=user
    )
    media_messages = await crud_message.get_media_messages_by_conversation(
        db=db, conversation_id=conversation_id, skip=skip, limit=limit
    )
    return media_messages

async def update_message(
    db: AsyncSession, *, message_id: str, message_in: MessageUpdate, current_user: User
) -> Message:
    """
    Updates a message.
    """
    message = await crud_message.get_message_by_id(db, message_id=message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Message not found."
        )
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own messages.",
        )
    if message.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot edit a deleted message.",
        )
    if message.content is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only edit text messages.",
        )

    return await crud_message.update_message(
        db=db, message=message, message_in=message_in
    )


async def delete_message(db: AsyncSession, *, message_id: str, current_user: User):
    """
    Deletes a message.
    """
    message = await crud_message.get_message_by_id(db, message_id=message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Message not found."
        )
    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own messages.",
        )

    conversation = await crud_conversation.get_conversation_by_id(
        db, conversation_id=message.conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found."
        )

    deleted_message = await crud_message.delete_message(db=db, message=message)
    await connection_manager.emit_to_users(
        [participant.id for participant in conversation.participants],
        build_event(
            "message_deleted",
            conversation_id=deleted_message.conversation_id,
            data=serialize_message(deleted_message),
        ),
    )
    return
