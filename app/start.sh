cd /opt/app


bun run --preload @opentelemetry/auto-instrumentations-node/register ./bin/www.js &

sleep 1

/opt/app/grafana-agent-linux-amd64  -config.expand-env -enable-features integrations-next --config.file /opt/app/grafana-agent-config.yaml  > $LOGFOLDER/grafana.log 2>&1 &

/usr/sbin/nginx 

tail -f /dev/null

#bun build --compile ./bin/www.js --preload @opentelemetry/auto-instrumentations-node/register --outfile pita
#./pita

#node --require @opentelemetry/auto-instrumentations-node/register ./bin/www 

