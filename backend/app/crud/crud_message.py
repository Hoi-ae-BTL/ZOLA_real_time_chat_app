from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from backend.app.db.base import Message
from backend.app.schemas.message import MessageCreate, MessageUpdate


async def create_message(
    db: AsyncSession, *, message_in: MessageCreate, sender_id: str
) -> Message:
    """
    Creates a new message in a conversation.
    """
    db_message = Message(
        **message_in.model_dump(),
        sender_id=sender_id,
    )
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    return db_message


async def get_messages_by_conversation(
    db: AsyncSession, *, conversation_id: str, skip: int = 0, limit: int = 100
) -> List[Message]:
    """
    Gets all messages for a given conversation, with pagination.
    """
    statement = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .offset(skip)
        .limit(limit)
        .options(joinedload(Message.sender)) # Eager load sender info
    )
    result = await db.execute(statement)
    return result.scalars().all()


async def get_message_by_id(db: AsyncSession, *, message_id: str) -> Optional[Message]:
    """
    Gets a single message by its ID.
    """
    statement = select(Message).where(Message.id == message_id)
    result = await db.execute(statement)
    return result.scalar_one_or_none()


async def update_message(
    db: AsyncSession, *, message: Message, message_in: MessageUpdate
) -> Message:
    """
    Updates a message.
    """
    update_data = message_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(message, field, value)
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message
