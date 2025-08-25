#!/bin/bash
# filepath: ./devops/general_config/set_lifecycle.sh

set -a
source .env
set +a

sudo curl -u elastic:"$ELASTIC_PASSWORD" \
	--cacert /var/lib/docker/volumes/ft_transcendence_certs/_data/ca/ca.crt \
	-X PUT "https://localhost:9200/_index_template/my_logstash_template" \
	-H "Content-Type: application/json" \
	--data-binary @devops/general_config/set_lifecycle.template