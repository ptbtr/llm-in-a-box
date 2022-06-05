import functools
import os
from pathlib import Path
from typing import Literal, Mapping, TypedDict

from pydantic import BaseModel, BaseSettings

OptModelStrings = Literal[
    "facebook/opt-125m",
    "facebook/opt-350m",
    "facebook/opt-1.3b",
    "facebook/opt-2.7b",
    "facebook/opt-6.7b",
    "facebook/opt-13b",
    "facebook/opt-30b",
]


class TaskPublishRetryPolicy(TypedDict, total=False):
    max_retries: int
    interval_start: int
    interval_step: float
    interval_max: float


class Settings(BaseSettings):
    opt_model_string: OptModelStrings

    # Celery settings
    broker_url: str
    result_backend: str
    # We load the model at worker start; give it plenty of time.
    worker_proc_alive_timeout: int = 60
    # If the spot instance goes down, we want to retry the tasks.
    task_acks_late: bool = True
    # task_acks_late alone doesn't handle the case of worker crash.
    task_reject_on_worker_lost: bool = True
    task_publish_retry: bool = True
    task_publish_retry_policy: TaskPublishRetryPolicy = {
        "max_retries": 12,
        "interval_start": 10,
    }
    use_gpu: bool = False

    class Config:
        env_file = Path(__file__).resolve().parent / f"{os.environ['ENV']}.env"


@functools.lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
