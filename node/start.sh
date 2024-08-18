cd /opt/app

#/usr/sbin/nginx 

/opt/app/grafana-agent-linux-amd64  -config.expand-env -enable-features integrations-next --config.file /opt/app/grafana-agent-config.yaml  > $LOGFOLDER/grafana.log 2>&1 &

node --require @opentelemetry/auto-instrumentations-node/register ./bin/www 

