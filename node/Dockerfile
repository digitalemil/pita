FROM oven/bun:latest

RUN apt-get update -y
RUN apt-get install --yes nginx curl unzip

WORKDIR /opt/app

RUN curl -LJO https://github.com/grafana/agent/releases/download/v0.39.0-rc.0/grafana-agent-linux-amd64.zip
RUN unzip grafana-agent-linux-amd64.zip 
RUN chmod +x grafana-agent-linux-amd64.zip 

COPY bin /opt/app/bin
COPY public /opt/app/public
COPY private /opt/app/private
COPY routes /opt/app/routes
COPY views /opt/app/views
COPY app.js /opt/app
COPY package.json /opt/app
COPY grafana-agent-config.yaml /opt/app
COPY start.sh /opt/app

COPY nginx.conf /etc/nginx/nginx.conf
RUN chmod +x /opt/app/start.sh

RUN cd /opt/app; bun install
<<<<<<< HEAD

RUN bun build --compile ./bin/www.js --preload @opentelemetry/auto-instrumentations-node/register --outfile pita
=======
>>>>>>> d0841c7a145cc04c45fe37e463e2d21a42061189

ENTRYPOINT /opt/app/start.sh