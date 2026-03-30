from fastapi import APIRouter, Depends, Query, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from backend.app.services import message_service
from backend.app.api import deps
from backend.app.db.base import User
from backend.app.schemas.message import (
    MessageCreate,
    MessageResponse,
)

router = APIRouter(prefix="/api/messages", tags=["Messages (Tin nhắn)"])


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    message_in: MessageCreate,
):
    """
    **API to send a message.**

    - The `sender_id` is automatically determined from the authentication token.
    - Business logic is handled by the message service.
    """
    message = await message_service.create_message(
        db=db, message_in=message_in, sender=current_user
    )
    return message


@router.get("/{conversation_id}", response_model=List[MessageResponse])
async def get_chat_history(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    conversation_id: str,
    skip: int = Query(0, ge=0, description="Number of messages to skip"),
    limit: int = Query(100, ge=1, le=200, description="Number of messages to return"),
):
    """
    **API to get the message history of a conversation.**

    - Implements pagination with `skip` and `limit`.
    - Business logic is handled by the message service.
    """
    messages = await message_service.get_messages_for_conversation(
        db=db,
        conversation_id=conversation_id,
        user=current_user,
        skip=skip,
        limit=limit,
    )
    return messages


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    message_id: str,
):
    """
    **API to revoke a message.**

    - A user can only revoke their own messages.
    - The message content will be cleared and `is_deleted` will be set to `True`.
    """
    await message_service.delete_message(
        db=db, message_id=message_id, current_user=current_user
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
