# ELK stack

## setting it up
following the docker compose tutorial in the elastic documentation

https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-compose

to run type `docker compose up`, if containers crash try looking at the logs `docker compose logs es01 | grep ERROR`

### error 78
`bootstrap check failure [1] of [2]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]`

then run this (which will reset if the machine is restarted)
`sudo sysctl -w vm.max_map_count=262144`
