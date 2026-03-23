from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from backend.app import crud
from backend.app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationDetailResponse,
)
from backend.app.api import deps
from backend.app.db.base import User

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
    - For a **direct** message, include the other user's ID in `participant_ids`.
    - For a **group** message, include all member IDs in `participant_ids` and provide a `group_name`.
    """
    # TODO: Add validation to ensure users exist
    conversation = await crud.create_conversation(
        db=db, conversation_in=conversation_in, creator_id=current_user.id
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
    conversations = await crud.get_user_conversations(db=db, user_id=current_user.id)
    return conversations


@router.get("/{conversation_id}",response_model=ConversationDetailResponse,)
async def get_conversation_details(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    conversation_id: str,
):
    """
    Get detailed information about a single conversation, including participants.
    """
    conversation = await crud.get_conversation_by_id(
        db=db, conversation_id=conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )

    # Check if the current user is a participant
    if not any(p.id == current_user.id for p in conversation.participants):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation.",
        )

    return conversation
