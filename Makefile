CDK_SRCS := $(wildcard cdk/*.ts)
APP_SRCS := $(wildcard app/*.py)
DOCKER_IMAGE_NAME := "ptbtr/llm-in-a-box:prod"

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

build:
	mkdir $@

build/npm-install: build cdk/package.json cdk/package-lock.json
	cd cdk && npm install
	touch $@

npm-install: build/npm-install
	@echo "NPM up to date"


build/manifests.yaml: build/npm-install cdk/lib/manifests.ts cdk/bin/tool.ts
	npx --prefix=cdk tool render --use-gpu=true $@

manifests: build/manifests.yaml
	@echo "Manifests up to date"

build/docker-image: build $(APP_SRCS) app/Dockerfile app/docker-compose.yml app/mypy.ini app/requirements.txt
	@docker-compose -f app/docker-compose.yml build production-image
	@touch $@

docker-image: build/docker-image
	@echo "Local Docker image up to date"

build/publish: build/docker-image
	@docker push $(DOCKER_IMAGE_NAME)
	@touch $@

publish: build/publish
	@echo "$(DOCKER_IMAGE_NAME) published to docker-hub"

build/cdk-deploy-no-rollback: npm-install publish manifests
	@echo "Deploying to CDK..."
	@cd cdk && npx --prefix=cdk cdk deploy --no-rollback --ClusterStack
	@touch $@

cdk-deploy-no-rollback: build/cdk-deploy-no-rollback
	@echo "CDK deployment complete"

build/kube-deploy: build/publish build/manifests.yaml
	@kubectl apply -f build/manifests.yaml

kube-deploy: build/kube-deploy
	@echo "Kubernetes deployment complete"

.PHONY: typecheck
typecheck:
	npm --prefix=cdk exec tsc --emitDeclarationOnly

.PHONY: cdk-diff
cdk-diff: $(CDK_SRCS) npm-install
	npx --prefix=cdk cdk diff

.PHONY: clean
clean:
	git clean -xdf
