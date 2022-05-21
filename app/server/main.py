import asyncio
from typing import TypedDict

from fastapi import FastAPI, Request

from worker import tasks

app = FastAPI()


class GenerateResponse(TypedDict):
    generated: str


@app.post("/generate")
async def generate(request: Request) -> GenerateResponse:
    request_json = await request.json()
    prompt = request_json["prompt"]
    result = tasks.generate.delay(prompt)
    for _ in range(500):
        if result.ready():
            break
        await asyncio.sleep(0.5)
    return {"generated": result.get()}


class HealthResponse(TypedDict): ...


@app.get("/health")
async def health() -> HealthResponse:
    return {}