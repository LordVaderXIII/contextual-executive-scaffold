COMPOSE_FILE := deploy/docker-compose.yml

.PHONY: compose-config compose-build compose-up smoke smoke-profile

compose-config:
	docker compose -f $(COMPOSE_FILE) config

compose-build:
	docker compose -f $(COMPOSE_FILE) build

compose-up:
	CES_WEB_PORT=$${CES_WEB_PORT:-8081} docker compose -f $(COMPOSE_FILE) up -d --wait

smoke:
	chmod +x scripts/smoke.sh
	CES_WEB_PORT=$${CES_WEB_PORT:-8081} ./scripts/smoke.sh

smoke-profile:
	docker compose -f $(COMPOSE_FILE) --profile smoke run --rm ces-smoke