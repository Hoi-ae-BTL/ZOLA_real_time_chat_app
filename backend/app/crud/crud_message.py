from typing import List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.base import Message, Conversation
from backend.app.schemas.message import MessageCreate, MessageUpdate


async def create_message(
    db: AsyncSession, *, message_in: MessageCreate, sender_id: str
) -> Message:
    """Creates a new message and updates the conversation's last message details."""
    db_message = Message(
        **message_in.model_dump(),
        sender_id=sender_id,
    )
    db.add(db_message)
    await db.flush()

    last_message_content = ""
    if message_in.content:
        last_message_content = message_in.content
    elif message_in.img_url:
        # Handle single or multiple images
        if len(message_in.img_url) > 1:
            last_message_content = f"🖼️ [{len(message_in.img_url)} images]"
        else:
            last_message_content = "🖼️ [Image]"
    elif message_in.file_name:
        last_message_content = f"📎 {message_in.file_name}"

    update_conversation_stmt = (
        update(Conversation)
        .where(Conversation.id == message_in.conversation_id)
        .values(
            last_message_content=last_message_content,
            last_message_created_at=db_message.created_at,
            last_message_sender=sender_id,
            updated_at=db_message.created_at,
        )
    )
    await db.execute(update_conversation_stmt)
    await db.commit()
    await db.refresh(db_message)
    return db_message

async def get_messages_by_conversation(
    db: AsyncSession, *, conversation_id: str, skip: int = 0, limit: int = 100
) -> List[Message]:
    """Gets all messages for a conversation."""
    statement = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(statement)
    return result.scalars().all()

async def get_message_by_id(
    db: AsyncSession, *, message_id: str
) -> Optional[Message]:
    """Gets a message by its ID."""
    statement = select(Message).where(Message.id == message_id)
    result = await db.execute(statement)
    return result.scalar_one_or_none()

async def update_message(
    db: AsyncSession, *, message: Message, message_in: MessageUpdate
) -> Message:
    """Updates a message's content and sets the is_edited flag."""
    message.content = message_in.content
    message.is_edited = True
    db.add(message)
    await db.flush()

    conversation = (await db.execute(select(Conversation).where(Conversation.id == message.conversation_id))).scalar_one()
    if conversation.last_message_created_at == message.created_at:
        await db.execute(
            update(Conversation)
            .where(Conversation.id == message.conversation_id)
            .values(
                last_message_content=message.content,
                updated_at=message.updated_at
            )
        )

    await db.commit()
    await db.refresh(message)
    return message

async def delete_message(db: AsyncSession, *, message: Message):
    """Deletes a message by setting is_deleted to True."""
    conversation_id = message.conversation_id
    message_id = message.id
    
    conv_stmt = select(Conversation).where(Conversation.id == conversation_id)
    conversation = (await db.execute(conv_stmt)).scalar_one()

    is_last_message = conversation.last_message_created_at == message.created_at

    await db.execute(
        update(Message)
        .where(Message.id == message_id)
        .values(is_deleted=True, content=None, img_url=None, file_url=None, file_name=None)
    )

    if is_last_message:
        latest_message_stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id, Message.is_deleted == False)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        latest_message = (await db.execute(latest_message_stmt)).scalar_one_or_none()

        if latest_message:
            if latest_message.content:
                last_content = latest_message.content
            elif latest_message.img_url:
                last_content = "🖼️ [Image]"
            else:
                last_content = f"📎 {latest_message.file_name}"
            
            await db.execute(
                update(Conversation)
                .where(Conversation.id == conversation_id)
                .values(
                    last_message_content=last_content,
                    last_message_created_at=latest_message.created_at,
                    last_message_sender=latest_message.sender_id,
                    updated_at=latest_message.created_at,
                )
            )
        else:
            await db.execute(
                update(Conversation)
                .where(Conversation.id == conversation_id)
                .values(
                    last_message_content="Message has been removed",
                    last_message_created_at=conversation.updated_at,
                    last_message_sender=message.sender_id,
                )
            )
    
    await db.commit()
    return await get_message_by_id(db, message_id=message_id)
