from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from backend.app import services
from backend.app.crud import crud_conversation
from backend.app.api import deps
from backend.app.db.base import User
from backend.app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationDetailResponse,
)

router = APIRouter(prefix="/api/conversations", tags=["Conversations (Nhắn tin)"])


@router.post(
    "/",
    response_model=ConversationDetailResponse,
    status_code=status.HTTP_201_CREATED,
)


# db: get phien ket noi vs db
# current_user: get current user online
# conversation_in: du lieu gui len phan body cua request POST
async def create_conversation(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    conversation_in: ConversationCreate,
):
    """
    Create a new conversation.
    - For a **direct** message, include the other user's ID in `user_ids`.
    - For a **group** message, include all member IDs in `user_ids` and provide a `group_name`.
    """
    conversation = await services.conversation_service.create_conversation(
        db=db,  creator=current_user, conversation_in=conversation_in
    )
    return conversation


@router.get("/", response_model=List[ConversationResponse])
async def get_user_conversations(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get all conversations for the current user.
    """
    # This logic is simple enough to remain in the CRUD layer for now.
    conversations = await crud_conversation.get_user_conversations(db=db, user_id=current_user.id)
    return conversations


@router.get(
    "/{conversation_id}",
    response_model=ConversationDetailResponse,
)
async def get_conversation_details(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    conversation_id: str,
):
    """
    Get detailed information about a single conversation, including participants.
    """
    conversation = await services.conversation_service.get_and_validate_conversation(
        db=db, conversation_id=conversation_id, user=current_user
    )
    return conversation
