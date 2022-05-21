import functools
import os
from pathlib import Path
from typing import Literal

import pydantic

OptModelStrings = Literal[
    "facebook/opt-125m",
    "facebook/opt-350m",
    "facebook/opt-1.3b",
    "facebook/opt-2.7b",
    "facebook/opt-6.7b",
    "facebook/opt-13b",
    "facebook/opt-30b",
]


class Settings(pydantic.BaseSettings):
    opt_model_string: OptModelStrings

    class Config:
        env_file = Path(__file__).resolve().parent / f"{os.environ['ENV']}.env"


@functools.lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
