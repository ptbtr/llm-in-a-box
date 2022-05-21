import asyncio
import logging
from typing import TypedDict

from fastapi import FastAPI, HTTPException, Request

from server import celery_adapter
from worker import tasks

app = FastAPI()

log = logging.getLogger(__name__)


class GenerateResponse(TypedDict):
    generated: str


@app.post("/completions")
async def generate(request: Request) -> GenerateResponse:
    request_json = await request.json()
    prompt = request_json["prompt"]
    max_tokens = request_json.get("max_tokens", 16)
    text = await celery_adapter.apply_async(
        tasks.complete,
        poll_interval=0.5,
        args=(prompt, max_tokens),
    )
    return {"text": text}


class LiveResponse(TypedDict):
    ...


@app.get("/live")
async def live() -> LiveResponse:
    return {}


class ReadyResponse(TypedDict):
    ...


@app.get("/ready")
async def ready() -> ReadyResponse:
    try:
        await celery_adapter.apply_async(tasks.ready, poll_interval=0.1)
    except celery_adapter.TaskFailed as e:
        log.exception("Ready task failed")
        raise HTTPException(status_code=404, detail="Unexpected failure loading model")
    return {}
