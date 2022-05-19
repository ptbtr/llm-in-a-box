PY_SRCS := $(wildcard app/server/*.py)
CDK_SRCS := $(wildcard app/cdk/*.ts)

dev-server: $(PY_SRCS) app/requirements.txt app/Dockerfile
	docker build app/ --target=dev --tag llm-in-a-box:dev
	touch $@

run-dev-server: dev-server
	@docker run --rm \
		-p 8000:8000 \
		--volume $(PWD)/app/server:/src/server:z \
		--mount type=volume,source=transformers-cache,target=/transformers-cache \
		llm-in-a-box:dev

npm-install: cdk/package.json cdk/package-lock.json
	npm install --prefix cdk
	touch $@

.PHONY: typecheck
typecheck:
	cd cdk && npx tsc --emitDeclarationOnly

.PHONY: cdk-diff
cdk-diff: $(CDK_SRCS) npm-install
	cd cdk && npx cdklocal diff

.PHONY: clean
clean:
	rm -rf app/server/__pycache__
	rm -rf cdk/node_modules
	rm -f npm-install dev-server