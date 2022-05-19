PY_SRCS := $(wildcard app/server/*.py)

dev-server: $(PY_SRCS) app/requirements.txt app/Dockerfile
	docker build app/ --target=dev --tag llm-in-a-box:dev

run-dev-server: dev-server
	@docker run --rm \
		-p 8000:8000 \
		--volume $(PWD)/app/server:/src/server:z \
		--mount type=volume,source=transformers-cache,target=/transformers-cache \
		llm-in-a-box:dev
