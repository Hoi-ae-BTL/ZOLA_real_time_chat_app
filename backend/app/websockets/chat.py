import json

from fastapi import APIRouter, WebSocket, status
from jose import JWTError, jwt
from starlette.websockets import WebSocketDisconnect

from backend.app.core.security import ALGORITHM, SECRET_KEY
from backend.app.crud import crud_friend
from backend.app.crud.crud_user import get_user_by_id
from backend.app.db.base import User
from backend.app.db.session import async_session
from backend.app.services import conversation_service
from backend.app.websockets.broker import event_broker
from backend.app.websockets.socket_manager import build_event, connection_manager

router = APIRouter()


async def authenticate_websocket(websocket: WebSocket) -> User | None:
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    async with async_session() as db:
        user = await get_user_by_id(db, user_id=user_id)

    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    return user


async def send_error(connection, code: str, message: str) -> None:
    await connection_manager.send_to_connection(
        connection,
        build_event(
            "error",
            data={
                "code": code,
                "message": message,
            },
        ),
    )


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    user = await authenticate_websocket(websocket)
    if user is None:
        return

    async with async_session() as db:
        friend_ids = await crud_friend.get_friend_user_ids(db, user_id=user.id)

    connection, is_first_local_connection = await connection_manager.connect(user.id, websocket)
    is_first_connection = is_first_local_connection
    if event_broker.enabled:
        is_first_connection = await event_broker.register_presence(user.id)

    online_friend_ids = connection_manager.get_connected_user_ids(friend_ids)
    if event_broker.enabled:
        online_friend_ids = await event_broker.get_online_user_ids(friend_ids)

    await connection_manager.send_to_connection(
        connection,
        build_event(
            "connected",
            data={
                "user_id": user.id,
                "latest_event_id": connection_manager.latest_event_id(user.id),
            },
        ),
    )
    await connection_manager.send_to_connection(
        connection,
        build_event(
            "presence_snapshot",
            data={
                "online_user_ids": online_friend_ids,
            },
        ),
    )

    if is_first_connection and friend_ids:
        await connection_manager.emit_to_users(
            friend_ids,
            build_event(
                "presence_changed",
                data={
                    "user_id": user.id,
                    "is_online": True,
                },
            ),
        )

    try:
        while True:
            raw_message = await websocket.receive_text()
            if not raw_message:
                continue

            try:
                payload = json.loads(raw_message)
            except json.JSONDecodeError:
                await send_error(
                    connection,
                    "invalid_json",
                    "WebSocket payload must be valid JSON.",
                )
                continue

            event_type = payload.get("type")
            if event_type == "ping":
                await connection_manager.send_to_connection(connection, build_event("pong"))
                continue

            if event_type == "sync_request":
                last_event_id = payload.get("last_event_id", 0)
                if not isinstance(last_event_id, int) or last_event_id < 0:
                    await send_error(
                        connection,
                        "invalid_last_event_id",
                        "last_event_id must be a non-negative integer.",
                    )
                    continue

                await connection_manager.send_to_connection(
                    connection,
                    connection_manager.replay_events_since(user.id, last_event_id),
                )
                continue

            if event_type in {"typing_start", "typing_stop", "mark_seen"}:
                conversation_id = payload.get("conversation_id")
                if not conversation_id or not isinstance(conversation_id, str):
                    await send_error(
                        connection,
                        "missing_conversation_id",
                        "conversation_id is required for this event.",
                    )
                    continue

                async with async_session() as db:
                    try:
                        conversation = await conversation_service.get_and_validate_conversation(
                            db=db,
                            conversation_id=conversation_id,
                            user=user,
                        )
                    except Exception as exc:
                        detail = getattr(exc, "detail", "Conversation access denied.")
                        await send_error(connection, "invalid_conversation", str(detail))
                        continue

                    participant_ids = [
                        participant.id for participant in conversation.participants
                    ]

                    if event_type == "mark_seen":
                        await conversation_service.mark_conversation_seen(
                            db=db,
                            conversation_id=conversation_id,
                            current_user=user,
                        )
                        continue

                recipient_ids = [
                    participant_id
                    for participant_id in participant_ids
                    if participant_id != user.id
                ]
                await connection_manager.emit_to_users(
                    recipient_ids,
                    build_event(
                        "typing_started" if event_type == "typing_start" else "typing_stopped",
                        conversation_id=conversation_id,
                        data={"user_id": user.id},
                    ),
                )
                continue

            await send_error(
                connection,
                "unsupported_event",
                "Unsupported WebSocket event type.",
            )
    except WebSocketDisconnect:
        pass
    finally:
        is_last_connection = await connection_manager.disconnect(user.id, connection)
        if event_broker.enabled:
            is_last_connection = await event_broker.unregister_presence(user.id)
        if is_last_connection:
            async with async_session() as db:
                friend_ids = await crud_friend.get_friend_user_ids(db, user_id=user.id)
            if friend_ids:
                await connection_manager.emit_to_users(
                    friend_ids,
                    build_event(
                        "presence_changed",
                        data={
                            "user_id": user.id,
                            "is_online": False,
                        },
                    ),
                )
