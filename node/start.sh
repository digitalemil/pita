cd /opt/app

/opt/app/grafana-agent-linux-amd64  -config.expand-env -enable-features integrations-next --config.file /opt/app/grafana-agent-config.yaml &
node --require @opentelemetry/auto-instrumentations-node/register ./bin/www 
