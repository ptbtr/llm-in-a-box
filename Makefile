PY_SRCS := $(wildcard server/*.py)

dev-server: $(PY_SRCS) requirements.txt Dockerfile
	docker build . --target=dev --tag llm-in-a-box:dev

run-dev-server: dev-server
	@docker run --rm \
		-p 8000:8000 \
		--volume $(PWD)/server:/src/server:z \
		--mount type=volume,source=transformers-cache,target=/transformers-cache \
		llm-in-a-box:dev
