from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from backend.app import services
from backend.app.api import deps
from backend.app.db.base import User
from backend.app.crud import crud_conversation
from backend.app.schemas.conversation import (
    ConversationDetailResponse,
    ConversationCreate,
    ConversationResponse,
    ConversationUpdate,
    AddMemberRequest,
    RemoveMemberRequest
)

router = APIRouter(prefix="/api/conversations", tags=["Conversations (Nhắn tin)"])


@router.post("/", response_model=ConversationDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    conversation_in: ConversationCreate,
):
    """Create a new conversation (direct or group)."""
    conversation = await services.conversation_service.create_conversation(
        db=db, creator=current_user, conversation_in=conversation_in
    )
    return conversation


@router.get("/", response_model=List[ConversationResponse])
async def get_user_conversations(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Get all conversations for the current user."""
    conversations = await crud_conversation.get_user_conversations(db=db, user_id=current_user.id)
    return conversations


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation_details(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    conversation_id: str,
):
    """Get detailed information about a single conversation."""
    conversation = await services.conversation_service.get_and_validate_conversation(
        db=db, conversation_id=conversation_id, user=current_user
    )
    return conversation


@router.put("/{conversation_id}", response_model=ConversationDetailResponse)
async def update_group_conversation(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    conversation_id: str,
    conversation_in: ConversationUpdate,
):
    """Update a group conversation's details (e.g., name). Only for group admins."""
    conversation = await services.conversation_service.update_group_conversation(
        db=db, conversation_id=conversation_id, conversation_in=conversation_in, user=current_user
    )
    return conversation


@router.post("/{conversation_id}/members", response_model=ConversationDetailResponse)
async def add_conversation_members(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    conversation_id: str,
    members_in: AddMemberRequest,
):
    """Add members to a group conversation. Only for group admins."""
    conversation = await services.conversation_service.add_members(
        db=db, conversation_id=conversation_id, member_ids_in=members_in.user_ids, user=current_user
    )
    return conversation


@router.delete("/{conversation_id}/members", status_code=status.HTTP_204_NO_CONTENT)
async def remove_conversation_member(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    conversation_id: str,
    member_to_remove: RemoveMemberRequest,
):
    """Remove a member from a group (admin) or leave a group (member)."""
    await services.conversation_service.remove_member(
        db=db,
        conversation_id=conversation_id,
        member_id_to_remove=member_to_remove.user_id,
        current_user=current_user,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
