from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from backend.app.db.base import Conversation, ConversationParticipant, User
from backend.app.schemas.conversation import ConversationCreate


async def create_conversation(
    db: AsyncSession,
    *,
    conversation_in: ConversationCreate,
    creator_id: str,
) -> Conversation:
    """
    Creates a new conversation and adds participants.
    """
    # 1. Create Conversation object
    db_conversation = Conversation(
        type=conversation_in.type,
        group_name=conversation_in.group_name if conversation_in.type == "group" else None,
        group_created_by=creator_id if conversation_in.type == "group" else None,
    )
    db.add(db_conversation)
    await db.flush()  # Flush to get the conversation ID

    # 2. Create ConversationParticipant objects
    participant_ids = set(conversation_in.participant_ids)
    participant_ids.add(creator_id)  # Creator is also a participant

    participants = [
        ConversationParticipant(
            user_id=user_id, conversation_id=db_conversation.id
        )
        for user_id in participant_ids
    ]
    db.add_all(participants)

    await db.commit()
    await db.refresh(
        db_conversation,
        [
            "participants",
            "group_creator",
        ],
    )
    return db_conversation


async def get_conversation_by_id(
    db: AsyncSession, *, conversation_id: str
) -> Optional[Conversation]:
    """
    Gets a single conversation by its ID, loading participants.
    """
    statement = (
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(
            joinedload(Conversation.participants),
            joinedload(Conversation.seen_by),
            joinedload(Conversation.group_creator),
        )
    )
    result = await db.execute(statement)
    return result.scalar_one_or_none()


async def get_user_conversations(
    db: AsyncSession, *, user_id: str
) -> List[Conversation]:
    """
    Gets all conversations for a given user.
    """
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
