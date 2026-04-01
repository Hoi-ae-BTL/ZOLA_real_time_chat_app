# NOTIFICATION
# u can change the schema of the database in here, REMEMBER TO NOTICE IT IN THE COMMIT MESSAGE BEFORE PUSH ON GITHUB
# the "init" data for the schema relies in the ./seed.py file, u can edit it if you want
# sqalchemy format btw

import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ConversationType(enum.Enum):
    direct = "direct"
    group  = "group"


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "User"

    id              : Mapped[str]           = mapped_column(Text, primary_key=True, server_default=func.gen_random_uuid().cast(Text))
    username        : Mapped[str]           = mapped_column(Text, unique=True, nullable=False)
    hashed_password : Mapped[str]           = mapped_column("hashedPassword", Text, nullable=False)
    display_name    : Mapped[str]           = mapped_column("displayName",    Text, nullable=False)
    email           : Mapped[Optional[str]] = mapped_column(Text, unique=True)
    avatar_url      : Mapped[Optional[str]] = mapped_column("avatarUrl", Text)
    avatar_id       : Mapped[Optional[str]] = mapped_column("avatarId",  Text)
    bio             : Mapped[Optional[str]] = mapped_column(Text)
    phone           : Mapped[Optional[str]] = mapped_column(Text)
    created_at      : Mapped[datetime]      = mapped_column("createdAt", DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at      : Mapped[datetime]      = mapped_column("updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    sent_friend_requests     : Mapped[List["FriendRequest"]] = relationship("FriendRequest", foreign_keys="FriendRequest.from_user_id", back_populates="sender",   cascade="all, delete-orphan")
    received_friend_requests : Mapped[List["FriendRequest"]] = relationship("FriendRequest", foreign_keys="FriendRequest.to_user_id",   back_populates="receiver", cascade="all, delete-orphan")

    friendships_as_a : Mapped[List["Friend"]] = relationship("Friend", foreign_keys="Friend.user_a", back_populates="user_a_rel", cascade="all, delete-orphan")
    friendships_as_b : Mapped[List["Friend"]] = relationship("Friend", foreign_keys="Friend.user_b", back_populates="user_b_rel", cascade="all, delete-orphan")

    conversations      : Mapped[List["Conversation"]] = relationship("Conversation", secondary="ConversationParticipant", back_populates="participants")
    seen_conversations : Mapped[List["Conversation"]] = relationship("Conversation", secondary="ConversationSeenBy",      back_populates="seen_by")

    sent_messages : Mapped[List["Message"]] = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender", cascade="all, delete-orphan")
    sessions      : Mapped[List["Session"]] = relationship("Session", back_populates="user", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# FriendRequest
# ---------------------------------------------------------------------------

class FriendRequest(Base):
    __tablename__ = "FriendRequest"

    id           : Mapped[str]           = mapped_column(Text, primary_key=True, server_default=func.gen_random_uuid().cast(Text))
    from_user_id : Mapped[str]           = mapped_column("from", ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    to_user_id   : Mapped[str]           = mapped_column("to",   ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    message      : Mapped[Optional[str]] = mapped_column(Text)
    created_at   : Mapped[datetime]      = mapped_column("createdAt", DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at   : Mapped[datetime]      = mapped_column("updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    sender   : Mapped["User"] = relationship("User", foreign_keys=[from_user_id], back_populates="sent_friend_requests")
    receiver : Mapped["User"] = relationship("User", foreign_keys=[to_user_id],   back_populates="received_friend_requests")

    __table_args__ = (
        UniqueConstraint("from", "to", name="unique_friend_request"),
        CheckConstraint('"from" <> "to"', name="no_self_request"),
        Index("idx_friendrequest_from", "from"),
        Index("idx_friendrequest_to",   "to"),
    )


# ---------------------------------------------------------------------------
# Friend  (junction between two Users after accepting a FriendRequest)
# ---------------------------------------------------------------------------

class Friend(Base):
    __tablename__ = "Friend"

    id         : Mapped[str]      = mapped_column(Text, primary_key=True, server_default=func.gen_random_uuid().cast(Text))
    user_a     : Mapped[str]      = mapped_column("userA", ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    user_b     : Mapped[str]      = mapped_column("userB", ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    created_at : Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at : Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user_a_rel : Mapped["User"] = relationship("User", foreign_keys=[user_a], back_populates="friendships_as_a")
    user_b_rel : Mapped["User"] = relationship("User", foreign_keys=[user_b], back_populates="friendships_as_b")

    __table_args__ = (
        UniqueConstraint("userA", "userB", name="unique_friendship"),
        CheckConstraint('"userA" <> "userB"', name="no_self_friendship"),
        Index("idx_friend_userA", "userA"),
        Index("idx_friend_userB", "userB"),
    )


# ---------------------------------------------------------------------------
# Conversation
# ---------------------------------------------------------------------------

class Conversation(Base):
    __tablename__ = "Conversation"

    id   : Mapped[str]                = mapped_column(Text, primary_key=True, server_default=func.gen_random_uuid().cast(Text))
    type : Mapped[ConversationType]   = mapped_column(Enum(ConversationType, name="conversation_type"), nullable=False)

    # group{} nested fields — only populated when type == 'group'
    group_name       : Mapped[Optional[str]] = mapped_column("groupName",      Text)
    group_created_by : Mapped[Optional[str]] = mapped_column("groupCreatedBy", ForeignKey("User.id", ondelete="SET NULL"))

    # lastMessage{} denormalised fields — updated on every new message for fast chat-list queries
    last_message_content    : Mapped[Optional[str]]      = mapped_column("lastMessageContent",   Text)
    last_message_created_at : Mapped[Optional[datetime]] = mapped_column("lastMessageCreatedAt", DateTime(timezone=True))
    last_message_sender     : Mapped[Optional[str]]      = mapped_column("lastMessageSender",    ForeignKey("User.id", ondelete="SET NULL"))

    created_at : Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at : Mapped[datetime] = mapped_column("updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    participants : Mapped[List["User"]]    = relationship("User", secondary="ConversationParticipant", back_populates="conversations")
    seen_by      : Mapped[List["User"]]    = relationship("User", secondary="ConversationSeenBy",      back_populates="seen_conversations")
    messages     : Mapped[List["Message"]] = relationship("Message", back_populates="conversation",    cascade="all, delete-orphan")

    group_creator           : Mapped[Optional["User"]] = relationship("User", foreign_keys=[group_created_by])
    last_message_sender_rel : Mapped[Optional["User"]] = relationship("User", foreign_keys=[last_message_sender])

    __table_args__ = (
        Index("idx_conversation_type", "type"),
        CheckConstraint(
            "(type = 'group') OR (type = 'direct' AND \"groupName\" IS NULL AND \"groupCreatedBy\" IS NULL)",
            name="check_group_fields_conditional"
        ),
    )

    @property
    def participant_count(self) -> int:
        return len(self.participants or [])


# ---------------------------------------------------------------------------
# ConversationParticipant  (User <-> Conversation many-to-many)
# ---------------------------------------------------------------------------

class ConversationParticipant(Base):
    __tablename__ = "ConversationParticipant"

    user_id         : Mapped[str] = mapped_column("userId",         ForeignKey("User.id",         ondelete="CASCADE"), primary_key=True)
    conversation_id : Mapped[str] = mapped_column("conversationId", ForeignKey("Conversation.id", ondelete="CASCADE"), primary_key=True)
    is_hidden       : Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index("idx_participant_user", "userId"),
        Index("idx_participant_conv", "conversationId"),
    )


# ---------------------------------------------------------------------------
# ConversationSeenBy  (tracks which Users have seen a Conversation)
# ---------------------------------------------------------------------------

class ConversationSeenBy(Base):
    __tablename__ = "ConversationSeenBy"

    user_id         : Mapped[str]      = mapped_column("userId",         ForeignKey("User.id",         ondelete="CASCADE"), primary_key=True)
    conversation_id : Mapped[str]      = mapped_column("conversationId", ForeignKey("Conversation.id", ondelete="CASCADE"), primary_key=True)
    seen_at         : Mapped[datetime] = mapped_column("seenAt", DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_seenby_user", "userId"),
        Index("idx_seenby_conv", "conversationId"),
    )


# ---------------------------------------------------------------------------
# Message
# ---------------------------------------------------------------------------

class Message(Base):
    __tablename__ = "Message"

    id              : Mapped[str]           = mapped_column(Text, primary_key=True, server_default=func.gen_random_uuid().cast(Text))
    sender_id       : Mapped[str]           = mapped_column("senderId",       ForeignKey("User.id",         ondelete="CASCADE"), nullable=False)
    conversation_id : Mapped[str]           = mapped_column("conversationId", ForeignKey("Conversation.id", ondelete="CASCADE"), nullable=False)
    content         : Mapped[Optional[str]] = mapped_column(Text)
    img_url         : Mapped[Optional[List[str]]] = mapped_column("imgUrl", ARRAY(Text))
    file_url        : Mapped[Optional[str]] = mapped_column("fileUrl", Text)
    file_name       : Mapped[Optional[str]] = mapped_column("fileName", Text)
    is_deleted      : Mapped[bool]          = mapped_column(Boolean, default=False, nullable=False)
    is_edited       : Mapped[bool]          = mapped_column(Boolean, default=False, nullable=False)
    created_at      : Mapped[datetime]      = mapped_column("createdAt", DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at      : Mapped[datetime]      = mapped_column("updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    sender       : Mapped["User"]         = relationship("User",         foreign_keys=[sender_id],       back_populates="sent_messages")
    conversation : Mapped["Conversation"] = relationship("Conversation", foreign_keys=[conversation_id], back_populates="messages")

    __table_args__ = (
        CheckConstraint('is_deleted OR content IS NOT NULL OR "imgUrl" IS NOT NULL OR "fileUrl" IS NOT NULL', name="message_has_content"),
        Index("idx_message_conversation", "conversationId", "createdAt"),
        Index("idx_message_sender",       "senderId"),
    )


# ---------------------------------------------------------------------------
# Session (Quản lý Refresh Token)
# ---------------------------------------------------------------------------

class Session(Base):
    __tablename__ = "Session"

    id            : Mapped[str]      = mapped_column(Text, primary_key=True, server_default=func.gen_random_uuid().cast(Text))
    user_id       : Mapped[str]      = mapped_column("userId", ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    refresh_token : Mapped[str]      = mapped_column("refreshToken", Text, unique=True, nullable=False)
    expires_at    : Mapped[datetime] = mapped_column("expiresAt", DateTime(timezone=True), nullable=False)
    created_at    : Mapped[datetime] = mapped_column("createdAt", DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user : Mapped["User"] = relationship("User", back_populates="sessions")
