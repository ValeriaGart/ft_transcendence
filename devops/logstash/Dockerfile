ARG STACK_VERSION
FROM docker.elastic.co/logstash/logstash:${STACK_VERSION}


# RUN apt-get update && apt-get upgrade

USER root
RUN echo "Setting file permissions" \
	&& mkdir -p /usr/share/logstash/config/certs \
	&& ls -la /usr/share/logstash/config/ \
	&& chmod -R 644 /usr/share/logstash/config/certs

USER logstash

ENTRYPOINT [ "/usr/local/bin/docker-entrypoint" ]