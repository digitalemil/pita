cd /opt/app

/usr/sbin/nginx 

/opt/app/grafana-agent-linux-amd64  -config.expand-env -enable-features integrations-next --config.file /opt/app/grafana-agent-config.yaml  > $LOGFOLDER/grafana.log 2>&1 &

<<<<<<< HEAD
#bun run --preload @opentelemetry/auto-instrumentations-node/register ./bin/www.js
=======
bun run --preload @opentelemetry/auto-instrumentations-node/register ./bin/www.js
>>>>>>> d0841c7a145cc04c45fe37e463e2d21a42061189
#node --require @opentelemetry/auto-instrumentations-node/register ./bin/www 

