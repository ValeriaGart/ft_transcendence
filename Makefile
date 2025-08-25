ES_LOG=./logs_es/es01-docker.log

.PHONY: elk-up elk-down elk-logs

config-devops:
	sudo sysctl -w vm.max_map_count=262144
	sudo chown root:root ./devops/filebeat/config/filebeat.example.yml
	sudo chmod go-w ./devops/filebeat/config/filebeat.example.yml

elk-up:
	@echo "Starting es01..."
	docker compose up -d es01
	@echo "Waiting for es01 to be healthy..."
	@while [ "$$(docker inspect -f '{{.State.Health.Status}}' $$(docker compose ps -q es01))" != "healthy" ]; do sleep 2; done
	@echo "Redirecting es01 logs to $(ES_LOG) in background..."
	@nohup docker compose logs -f es01 > $(ES_LOG) 2>&1 &
	@echo "Starting the rest of the ELK stack..."
	docker compose up -d kibana logstash filebeat

elk-down:
	docker compose down

elk-logs:
	@echo "Showing es01 logs (Ctrl+C to stop):"
	docker compose logs -f es01

elk-status:
	docker compose ps
