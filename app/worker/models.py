import logging
from pathlib import Path
from typing import ClassVar, Literal

from transformers import GPT2Tokenizer, OPTForCausalLM

from settings import config

log = logging.getLogger(__name__)


class OptModel:
    tokenizer_cache: ClassVar[dict[str, GPT2Tokenizer]] = {}
    opt_cache: ClassVar[dict[str, OPTForCausalLM]] = {}

    def __init__(self, opt_model_string: str) -> None:
        if (tokenizer := self.tokenizer_cache.get(opt_model_string)) is not None:
            log.info("Found tokenizer for %s in the cache", opt_model_string)
            self.tokenizer = tokenizer
        else:
            log.info("Loading tokenizer for %s", opt_model_string)
            self.tokenizer = GPT2Tokenizer.from_pretrained(opt_model_string)
            log.info("Loaded tokenizer for %s", opt_model_string)
            self.tokenizer_cache[opt_model_string] = self.tokenizer

        if (opt := self.opt_cache.get(opt_model_string)) is not None:
            log.info("Found %s in the cache", opt_model_string)
            self.opt = opt
        else:
            log.info("Loading %s", opt_model_string)
            self.opt = OPTForCausalLM.from_pretrained(opt_model_string)
            log.info("Loaded %s", opt_model_string)
            self.opt_cache[opt_model_string] = self.opt

    @classmethod
    def from_settings(cls) -> "OptModel":
        settings = config.get_settings()
        return cls(settings.opt_model_string)


    @staticmethod
    def settings_model_cached() -> None:
        opt_model_string = config.get_settings().opt_model_string
        return (
            opt_model_string in OptModel.tokenizer_cache
            and opt_model_string in OptModel.opt_cache
        )

    def complete(self, prompt: str) -> str:
        inputs = self.tokenizer(prompt, return_tensors="pt")
        generate_ids = self.opt.generate(inputs.input_ids, max_length=30)
        return self.tokenizer.batch_decode(
            generate_ids,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False,
        )[0]
