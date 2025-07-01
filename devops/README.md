# ELK stack

## setting it up
following the docker compose tutorial in the elastic documentation

https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-compose

to run type `docker compose up`, if containers crash try looking at the logs `docker compose logs es01 | grep ERROR`

### error 78
`bootstrap check failure [1] of [2]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]`

then run this (which will reset if the machine is restarted)
`sudo sysctl -w vm.max_map_count=262144`


## logstash and filebeat
run `docker compose up logstash filebeat`, the two services will start.

filebeat will complain about filebeat.example.yml permissions if not set correctly, use `sudo chown root:root filebeat/config/filebeat.example.yml` and `sudo chmod go-w filebeat/config/filebeat.example.yml`

filebeat will read all `*.log` files in the mylogs directory, as directed in `devops/filebeat.example.yml`, but each log file needs to be mounted in docker compose service `filebeat` like the logstash-tutorial-dataset

echoing changes into the file on the host machine will therefore update the file in the filebeat docker container and trigger the functionality

```
echo "new logs 1234" >> ./mylogs/logstash-tutorial-dataset
```

## indexing
in logstash conf, set the index name to the name you want.
start up the stack and enter kibana. there in Elasticsearch->Index Management create the index with the name of the index in the logstash conf. 

## how it works
### start stack and navigate kibana
`docker compose up`
then open `localhost:5601` (kibana).
click the three lines on top left.
click Analytics->Discover.
select "my first data view".
make sure that the timeframe is set correctly on top right. (could be last 15 minutes for example).
see the logs!

### send a new log message
```
echo "new logs 1234" >> ./mylogs/logstash-tutorial-dataset
```