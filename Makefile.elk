# beware, not synced up with .env
ES_LOG_FILE=es01-docker.log
LOG_PATH_ES=/var/log/ft_transcendence/logs_es
LOG_PATH_BE=/var/log/ft_transcendence/logs_backend


.PHONY: elk-up elk-down elk-logs set-lifecycle

config-devops:
	sudo sysctl -w vm.max_map_count=262144
	sudo chown root:root ./devops/filebeat/config/filebeat.example.yml
	sudo chmod go-w ./devops/filebeat/config/filebeat.example.yml

elk-up:
	@echo "Starting es01..."
	docker compose up -d es01
	@echo "Waiting for es01 to be healthy..."
	@while [ "$$(docker inspect -f '{{.State.Health.Status}}' $$(docker compose ps -q es01))" != "healthy" ]; do sleep 2; done
	@echo "Redirecting es01 logs to ${LOG_PATH_ES}/$(ES_LOG_FILE) in background..."
	@nohup docker compose logs -f es01 > ${LOG_PATH_ES}/$(ES_LOG_FILE) 2>&1 &
	@echo "Starting the rest of the ELK stack..."
	docker compose up -d kibana logstash filebeat

elk-down:
	docker compose down

elk-logs:
	@echo "Showing es01 logs (Ctrl+C to stop):"
	docker compose logs -f es01


set-lifecycle:
	@echo "Setting index lifecycle template..."
	-@output=$$(sudo curl -u elastic:secret1 \
		--cacert /var/lib/docker/volumes/ft_transcendence_certs/_data/ca/ca.crt \
		-X PUT "https://localhost:9200/_index_template/my_template" \
		-H "Content-Type: application/json" \
		--data-binary @devops/kibana/config/lifecycle.template 2>/dev/null); \
	if echo "$$output" | grep -q '{"acknowledged":true}'; then \
		echo "Lifecycle template set successfully."; \
	else \
		echo "Unexpected response:"; \
		echo "$$output"; \
		exit 1; \
	fi

start-elk: elk-up set-lifecycle



setup-log-dir:
	sudo mkdir -p /var/log/ft_transcendence/logs_backend
	sudo mkdir -p /var/log/ft_transcendence/logs_es
	sudo chown ${USER}:${USER} ${LOG_PATH_ES} ${LOG_PATH_BE}
	sudo chmod 750 ${LOG_PATH_ES} ${LOG_PATH_BE}