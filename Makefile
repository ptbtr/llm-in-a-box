PY_SRCS := $(wildcard server/*.py)

.PHONY: server
server: $(PY_SRCS) requirements.txt Dockerfile
	docker build . --tag llm-in-a-box:latest

run-server: server
	docker run --rm \
		-p 8000:8000 \
		--mount source=transformers-cache,target=/transformers-cache \
		llm-in-a-box:latest
