FROM node:hydrogen

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
COPY o11y.js /opt/app
COPY grafana-agent-config.yaml /opt/app

RUN cd /opt/app; npm install

ENTRYPOINT node ./bin/www