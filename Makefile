CDK_SRCS := $(wildcard cdk/*.ts)

run-server:
	@docker compose -f app/docker-compose.yml up

run-server-chaotic:
	@docker compose -f app/docker-compose.yml up -d
	@./bin/run-server-chaotic

run-server-k8s:
	@./bin/run-server-k8s

lint:
	@docker compose -f app/docker-compose.yml up -d
	@echo "Running black..."
	@docker compose -f app/docker-compose.yml exec -- server black .
	@echo "Running isort..."
	@docker compose -f app/docker-compose.yml exec -- server isort .
	@echo "Running mypy..."
	@docker compose -f app/docker-compose.yml exec -- server mypy .

npm-install: cdk/package.json cdk/package-lock.json
	cd cdk && npm install
	touch $@

.PHONY: typecheck
typecheck:
	cd cdk && npm exec tsc --emitDeclarationOnly

.PHONY: cdk-diff
cdk-diff: $(CDK_SRCS) npm-install
	cd cdk && npm exec cdklocal diff

.PHONY: clean
clean:
	rm -rf app/server/__pycache__
	rm -rf cdk/node_modules
	rm -f npm-install dev-server
	rm -rf k8s/dist/
