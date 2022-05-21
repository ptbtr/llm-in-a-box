PY_SRCS := $(wildcard app/server/*.py)
CDK_SRCS := $(wildcard app/cdk/*.ts)

run-server:
	@docker compose -f app/docker-compose.yml up

make run-server-chaotic:
	@./bin/run-server-chaotic

lint:
	@docker compose -f app/docker-compose.yml up -d
	@echo "Running black..."
	@docker compose -f app/docker-compose.yml exec -- server /venv/bin/black .
	@echo "Running isort..."
	@docker compose -f app/docker-compose.yml exec -- server /venv/bin/isort .

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
