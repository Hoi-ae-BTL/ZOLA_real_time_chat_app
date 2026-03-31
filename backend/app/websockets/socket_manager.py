import asyncio
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable

from fastapi import WebSocket
from starlette.websockets import WebSocketState

from backend.app.db.base import Conversation, Friend, FriendRequest, Message, User

MAX_EVENT_HISTORY = 300
PublisherCallback = Callable[[list[str], dict[str, Any]], Awaitable[None]]


@dataclass
class SocketConnection:
    websocket: WebSocket
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)


def _serialize_datetime(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.isoformat()


def serialize_user(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
    }


def serialize_message(message: Message) -> dict[str, Any]:
    return {
        "id": message.id,
        "sender_id": message.sender_id,
        "conversation_id": message.conversation_id,
        "content": "Tin nhắn đã bị thu hồi" if message.is_deleted else message.content,
        "img_url": message.img_url,
        "file_url": message.file_url,
        "file_name": message.file_name,
        "is_deleted": message.is_deleted,
        "created_at": _serialize_datetime(message.created_at),
        "updated_at": _serialize_datetime(message.updated_at),
    }


def serialize_conversation(conversation: Conversation) -> dict[str, Any]:
    participants = getattr(conversation, "participants", []) or []
    seen_by = getattr(conversation, "seen_by", []) or []
    return {
        "id": conversation.id,
        "type": conversation.type.value if hasattr(conversation.type, "value") else conversation.type,
        "group_name": conversation.group_name,
        "group_created_by": conversation.group_created_by,
        "last_message_content": conversation.last_message_content,
        "last_message_created_at": _serialize_datetime(conversation.last_message_created_at),
        "last_message_sender": conversation.last_message_sender,
        "created_at": _serialize_datetime(conversation.created_at),
        "updated_at": _serialize_datetime(conversation.updated_at),
        "participants": [serialize_user(user) for user in participants],
        "seen_by": [
            {
                "user_id": user.id,
            }
            for user in seen_by
        ],
    }


def serialize_friend_request(friend_request: FriendRequest) -> dict[str, Any]:
    sender = getattr(friend_request, "sender", None)
    receiver = getattr(friend_request, "receiver", None)
    return {
        "id": friend_request.id,
        "from_user_id": friend_request.from_user_id,
        "to_user_id": friend_request.to_user_id,
        "message": friend_request.message,
        "created_at": _serialize_datetime(friend_request.created_at),
        "sender": serialize_user(sender) if sender else {"id": friend_request.from_user_id},
        "receiver": serialize_user(receiver) if receiver else {"id": friend_request.to_user_id},
    }


def serialize_friendship(friendship: Friend) -> dict[str, Any]:
    user_a = getattr(friendship, "user_a_rel", None)
    user_b = getattr(friendship, "user_b_rel", None)
    return {
        "id": friendship.id,
        "created_at": _serialize_datetime(friendship.created_at),
        "user_a": serialize_user(user_a) if user_a else {"id": friendship.user_a},
        "user_b": serialize_user(user_b) if user_b else {"id": friendship.user_b},
    }


def build_event(
    event_type: str,
    *,
    conversation_id: str | None = None,
    data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    event: dict[str, Any] = {"type": event_type}
    if conversation_id is not None:
        event["conversation_id"] = conversation_id
    if data is not None:
        event["data"] = data
    return event


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, list[SocketConnection]] = defaultdict(list)
        self._registry_lock = asyncio.Lock()
        self._event_sequence: dict[str, int] = defaultdict(int)
        self._event_history: dict[str, deque[dict[str, Any]]] = defaultdict(
            lambda: deque(maxlen=MAX_EVENT_HISTORY)
        )
        self._external_publisher: PublisherCallback | None = None

    def set_external_publisher(self, publisher: PublisherCallback | None) -> None:
        self._external_publisher = publisher

    async def connect(
        self, user_id: str, websocket: WebSocket
    ) -> tuple[SocketConnection, bool]:
        await websocket.accept()
        connection = SocketConnection(websocket=websocket)
        async with self._registry_lock:
            is_first_connection = not self._connections[user_id]
            self._connections[user_id].append(connection)
        return connection, is_first_connection

    async def disconnect(self, user_id: str, connection: SocketConnection) -> bool:
        async with self._registry_lock:
            user_connections = self._connections.get(user_id)
            if not user_connections:
                return False
            if connection in user_connections:
                user_connections.remove(connection)
            is_last_connection = not user_connections
            if is_last_connection:
                self._connections.pop(user_id, None)
        return is_last_connection

    async def send_to_connection(
        self, connection: SocketConnection, event: dict[str, Any]
    ) -> bool:
        websocket = connection.websocket
        if websocket.client_state != WebSocketState.CONNECTED:
            return False

        try:
            async with connection.lock:
                await websocket.send_json(event)
            return True
        except Exception:
            return False

    async def _prepare_event(self, user_id: str, event: dict[str, Any]) -> dict[str, Any]:
        self._event_sequence[user_id] += 1
        prepared_event = dict(event)
        prepared_event["meta"] = {
            "event_id": self._event_sequence[user_id],
            "issued_at": _serialize_datetime(datetime.now(timezone.utc)),
        }
        self._event_history[user_id].append(prepared_event)
        return prepared_event

    async def send_to_user(self, user_id: str, event: dict[str, Any]) -> dict[str, Any]:
        prepared_event = await self._prepare_event(user_id, event)
        async with self._registry_lock:
            connections = list(self._connections.get(user_id, []))

        stale_connections: list[SocketConnection] = []
        for connection in connections:
            sent = await self.send_to_connection(connection, prepared_event)
            if not sent:
                stale_connections.append(connection)

        for connection in stale_connections:
            await self.disconnect(user_id, connection)

        return prepared_event

    async def emit_to_users(
        self, user_ids: list[str], event: dict[str, Any], *, publish: bool = True
    ) -> None:
        normalized_user_ids = list(dict.fromkeys(user_ids))
        for user_id in normalized_user_ids:
            await self.send_to_user(user_id, event)

        if publish and self._external_publisher:
            await self._external_publisher(normalized_user_ids, event)

    async def dispatch_external_event(
        self, user_ids: list[str], event: dict[str, Any]
    ) -> None:
        await self.emit_to_users(user_ids, event, publish=False)

    def is_user_online(self, user_id: str) -> bool:
        return bool(self._connections.get(user_id))

    def get_connected_user_ids(self, user_ids: list[str]) -> list[str]:
        return [user_id for user_id in dict.fromkeys(user_ids) if self.is_user_online(user_id)]

    def latest_event_id(self, user_id: str) -> int:
        return self._event_sequence[user_id]

    def replay_events_since(self, user_id: str, last_event_id: int) -> dict[str, Any]:
        history = list(self._event_history[user_id])
        if not history:
            return build_event(
                "sync_batch",
                data={"events": [], "latest_event_id": self.latest_event_id(user_id)},
            )

        oldest_event_id = history[0]["meta"]["event_id"]
        latest_event_id = history[-1]["meta"]["event_id"]

        if last_event_id and last_event_id < oldest_event_id - 1:
            return build_event(
                "sync_required",
                data={
                    "latest_event_id": latest_event_id,
                    "reason": "history_gap",
                },
            )

        missed_events = [
            event for event in history if event["meta"]["event_id"] > last_event_id
        ]
        return build_event(
            "sync_batch",
            data={"events": missed_events, "latest_event_id": latest_event_id},
        )


connection_manager = ConnectionManager()
