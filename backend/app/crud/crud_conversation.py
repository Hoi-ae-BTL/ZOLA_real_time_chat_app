from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.base import Conversation, ConversationParticipant, User
from app.schemas.conversation import ConversationCreate, ConversationUpdate


async def create_conversation(
    db: AsyncSession,
    *,
    conversation_in: ConversationCreate,
    creator_id: str,
) -> Conversation:
    """Creates a new conversation and adds participants."""
    db_conversation = Conversation(
        type=conversation_in.type,
        group_name=conversation_in.group_name if conversation_in.type == "group" else None,
        group_created_by=creator_id if conversation_in.type == "group" else None,
    )
    db.add(db_conversation)
    await db.flush()

    user_ids = set(conversation_in.user_ids)
    user_ids.add(creator_id)
    participants = [
        ConversationParticipant(user_id=user_id, conversation_id=db_conversation.id)
        for user_id in user_ids
    ]
    db.add_all(participants)

    await db.commit()
    await db.refresh(db_conversation, ["participants", "group_creator"])
    return db_conversation


async def get_conversation_by_id(
    db: AsyncSession, *, conversation_id: str
) -> Optional[Conversation]:
    """Gets a single conversation by its ID, loading participants."""
    statement = (
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(joinedload(Conversation.participants), joinedload(Conversation.group_creator))
    )
    result = await db.execute(statement)
    return result.scalar_one_or_none()


async def get_user_conversations(db: AsyncSession, *, user_id: str) -> List[Conversation]:
    """Gets all conversations for a given user."""
    statement = (
        select(Conversation)
        .join(Conversation.participants)
        .where(User.id == user_id)
        .order_by(Conversation.updated_at.desc())
        .options(
            joinedload(Conversation.participants),
            joinedload(Conversation.last_message_sender_rel),
        )
    )
    result = await db.execute(statement)
    return result.scalars().all()


async def get_direct_conversation_by_users(
    db: AsyncSession, *, user1_id: str, user2_id: str
) -> Optional[Conversation]:
    """Finds a direct conversation that involves exactly two specific users."""
    statement = (
        select(Conversation)
        .join(ConversationParticipant, Conversation.id == ConversationParticipant.conversation_id)
        .where(Conversation.type == "direct")
        .group_by(Conversation.id)
        .having(
            and_(
                func.count(ConversationParticipant.user_id) == 2,
                func.bool_or(ConversationParticipant.user_id == user1_id),
                func.bool_or(ConversationParticipant.user_id == user2_id),
            )
        )
        .options(joinedload(Conversation.participants))
    )
    result = await db.execute(statement)
    return result.scalar_one_or_none()


async def add_members_to_conversation(
    db: AsyncSession, *, conversation: Conversation, user_ids: List[str]
) -> Conversation:
    """Adds new members to a conversation."""
    new_participants = [
        ConversationParticipant(user_id=user_id, conversation_id=conversation.id)
        for user_id in user_ids
    ]
    db.add_all(new_participants)
    await db.commit()
    await db.refresh(conversation, ["participants"])
    return conversation


async def remove_member_from_conversation(
    db: AsyncSession, *, conversation_id: str, user_id: str
) -> None:
    """Removes a member from a conversation."""
    statement = delete(ConversationParticipant).where(
        and_(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
    )
    await db.execute(statement)
    await db.commit()


async def update_conversation(
    db: AsyncSession, *, conversation: Conversation, conversation_in: ConversationUpdate
) -> Conversation:
    """Updates conversation details (e.g., group name)."""
    update_data = conversation_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(conversation, field, value)
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation
