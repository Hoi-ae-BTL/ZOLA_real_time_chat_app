import asyncio
import contextlib
import json
import os
import uuid
from typing import Any, Awaitable, Callable

try:
    from redis.asyncio import Redis
except Exception:  # pragma: no cover - optional dependency at runtime
    Redis = None


DispatchCallback = Callable[[list[str], dict[str, Any]], Awaitable[None]]
REDIS_CHANNEL = "zola:realtime"
PRESENCE_KEY_PREFIX = "zola:presence:"


class EventBroker:
    def __init__(self) -> None:
        self.redis_url = os.getenv("REDIS_URL")
        self.instance_id = os.getenv("REALTIME_INSTANCE_ID", uuid.uuid4().hex)
        self._client: Redis | None = None
        self._pubsub = None
        self._listener_task: asyncio.Task | None = None
        self._dispatch_callback: DispatchCallback | None = None

    @property
    def enabled(self) -> bool:
        return bool(self.redis_url and Redis is not None)

    async def start(self, dispatch_callback: DispatchCallback) -> None:
        self._dispatch_callback = dispatch_callback
        if not self.enabled:
            return

        self._client = Redis.from_url(self.redis_url, decode_responses=True)
        self._pubsub = self._client.pubsub()
        await self._pubsub.subscribe(REDIS_CHANNEL)
        self._listener_task = asyncio.create_task(self._listen())

    async def shutdown(self) -> None:
        if self._listener_task:
            self._listener_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._listener_task
            self._listener_task = None

        if self._pubsub:
            await self._pubsub.close()
            self._pubsub = None

        if self._client:
            await self._client.close()
            self._client = None

    async def publish(self, user_ids: list[str], event: dict[str, Any]) -> None:
        if not self.enabled or not self._client:
            return

        payload = {
            "instance_id": self.instance_id,
            "user_ids": user_ids,
            "event": event,
        }
        await self._client.publish(REDIS_CHANNEL, json.dumps(payload))

    async def register_presence(self, user_id: str) -> bool:
        if not self.enabled or not self._client:
            return True

        key = f"{PRESENCE_KEY_PREFIX}{user_id}"
        count = await self._client.incr(key)
        return count == 1

    async def unregister_presence(self, user_id: str) -> bool:
        if not self.enabled or not self._client:
            return True

        key = f"{PRESENCE_KEY_PREFIX}{user_id}"
        count = await self._client.decr(key)
        if count <= 0:
            await self._client.delete(key)
            return True
        return False

    async def get_online_user_ids(self, user_ids: list[str]) -> list[str]:
        if not self.enabled or not self._client or not user_ids:
            return []

        keys = [f"{PRESENCE_KEY_PREFIX}{user_id}" for user_id in user_ids]
        counts = await self._client.mget(keys)
        online_user_ids: list[str] = []
        for user_id, count in zip(user_ids, counts):
            try:
                if count is not None and int(count) > 0:
                    online_user_ids.append(user_id)
            except (TypeError, ValueError):
                continue
        return online_user_ids

    async def _listen(self) -> None:
        if not self._pubsub:
            return

        while True:
            message = await self._pubsub.get_message(
                ignore_subscribe_messages=True, timeout=1.0
            )
            if not message:
                await asyncio.sleep(0.1)
                continue

            try:
                payload = json.loads(message["data"])
            except Exception:
                continue

            if payload.get("instance_id") == self.instance_id:
                continue

            if self._dispatch_callback:
                await self._dispatch_callback(
                    payload.get("user_ids", []),
                    payload.get("event", {}),
                )


event_broker = EventBroker()
