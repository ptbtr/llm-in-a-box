import asyncio
from typing import Any, Mapping, Sequence

import celery


class TaskFailed(Exception):
    ...


async def apply_async(
    task: celery.Task,
    poll_interval: float,
    args: Sequence[Any] | None = None,
    kwargs: Mapping[str, Any] | None = None,
    **options,
) -> Any:
    async_result = task.apply_async(args=args, kwargs=kwargs, **options)
    while True:
        if async_result.ready():
            break
        await asyncio.sleep(poll_interval)
    try:
        return async_result.get()
    except Exception as e:
        raise TaskFailed from e
