from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from backend.app.services import conversation_service
from backend.app.crud import crud_message
from backend.app.schemas.message import (
    MessageCreate,

)
from backend.app.db.base import User, Message, Conversation


async def create_message(
    db: AsyncSession, *, message_in: MessageCreate, sender: User
) -> Message:
    """
    Handles the business logic for sending a message.
    1. Validates the user is a member of the conversation.
    2. Creates the message.
    3. Updates the conversation's last message fields.
    """
    # 1. Validate user is a member of the conversation
    conversation = await conversation_service.get_and_validate_conversation(
        db=db, conversation_id=message_in.conversation_id, user=sender
    )

    # 2. Create the message
    message = await crud_message.create_message(
        db=db, message_in=message_in, sender_id=sender.id
    )

    # 3. Update conversation's last_message fields
    conversation.last_message_content = message.content
    conversation.last_message_created_at = message.created_at
    conversation.last_message_sender = sender.id
    db.add(conversation)
    await db.commit()
    await db.refresh(message)

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
