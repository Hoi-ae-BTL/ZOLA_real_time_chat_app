from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from backend.app.services import conversation_service
from backend.app.crud import crud_message, crud_conversation
from backend.app.schemas.message import MessageCreate, MessageUpdate
from backend.app.db.base import User, Message


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
    return message


async def get_messages_for_conversation(
        db: AsyncSession, *, conversation_id: str, user: User, skip: int, limit: int
) -> list[Message]:
    """
    Handles the business logic for getting conversation messages.
    1. Validates the user is a member of the conversation.
    2. Fetches the messages.
    3. Reverses the list to show oldest messages first.
    """
    # 1. Validate user is a member of the conversation
    await conversation_service.get_and_validate_conversation(
        db=db, conversation_id=conversation_id, user=user
    )

    # 2. Fetch messages (they are likely ordered by newest first from CRUD)
    messages = await crud_message.get_messages_by_conversation(
        db=db, conversation_id=conversation_id, skip=skip, limit=limit
    )

    # 3. Reverse the list to get chronological order (oldest first)
    return messages[::-1]

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

    await crud_message.delete_message(db=db, message=message)
    return
