CDK_SRCS := $(wildcard cdk/*.ts)

run-server:
	@docker compose -f app/docker-compose.yml up

run-server-chaotic:
	@docker compose -f app/docker-compose.yml up -d
	@./bin/run-server-chaotic

lint:
	@docker compose -f app/docker-compose.yml up -d
	@echo "Running black..."
	@docker compose -f app/docker-compose.yml exec -- server black .
	@echo "Running isort..."
	@docker compose -f app/docker-compose.yml exec -- server isort .
	@echo "Running mypy..."
	@docker compose -f app/docker-compose.yml exec -- server mypy .

npm-install: cdk/package.json cdk/package-lock.json k8s/package.json k8s/package-lock.json
	npm install --prefix cdk
	npm install --prefix k8s
	touch $@


.PHONY: typecheck
typecheck:
	pushd cdk
	npx tsc --emitDeclarationOnly
	popd
	pushd k8s
	npx tsc --emitDeclarationOnly
	pod

k8s/dist/llm-in-a-box.k8s.yaml: $(wildcard k8s/*.ts) $(wildcard k8s/*.yaml) $(wildcard k8s/*.json) npm-install
	pushd k8s
	npm run compile
	npx cdk8s synth

.PHONY: cdk-diff
cdk-diff: $(CDK_SRCS) npm-install
	cd cdk && npx cdklocal diff

.PHONY: clean
clean:
	rm -rf app/server/__pycache__
	rm -rf cdk/node_modules
	rm -f npm-install dev-server
	rm -rf k8s/dist/
