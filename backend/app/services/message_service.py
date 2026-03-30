from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from backend.app.services import conversation_service
from backend.app.crud import crud_message
from backend.app.schemas.message import MessageCreate, MessageUpdate
from backend.app.db.base import User, Message


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
    """
    # 1. Validate user is a member of the conversation
    await conversation_service.get_and_validate_conversation(
        db=db, conversation_id=conversation_id, user=user
    )

    # 2. Fetch messages
    messages = await crud_message.get_messages_by_conversation(
        db=db, conversation_id=conversation_id, skip=skip, limit=limit
    )
    return messages[::-1]


async def revoke_message(db: AsyncSession, *, message_id: str, current_user: User) -> Message:
    """
    Handles the business logic for revoking a message.
    """
    # 1. Get the message
    message = await crud_message.get_message_by_id(db=db, message_id=message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found.")

    # 2. Check ownership
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only revoke your own messages.")

    # 3. Update the message
    message_update = MessageUpdate(content=None, img_url=None)
    message.is_deleted = True
    return await crud_message.update_message(db=db, message=message, message_in=message_update)
