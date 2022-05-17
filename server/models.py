import functools

from transformers import GPT2Tokenizer, OPTForCausalLM


class OptModel:
    def __init__(self) -> None:
        self.tokenizer = GPT2Tokenizer.from_pretrained("facebook/opt-350m")
        self.opt = OPTForCausalLM.from_pretrained("facebook/opt-350m")

    def generate(self, prompt: str) -> str:
        inputs = self.tokenizer(prompt, return_tensors="pt")
        generate_ids = self.opt.generate(inputs.input_ids, max_length=30)
        return self.tokenizer.batch_decode(
            generate_ids,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False,
        )[0]


@functools.lru_cache(maxsize=1)
def get_opt_model() -> OptModel:
    return OptModel()
