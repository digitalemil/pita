# 

# 

![](https://github.com/digitalemil/pita/blob/main/node/public/images/pita256.png)  

# Welcome to Pita\!

# Ever wanted to run an app like a pro but for (nearly) free?

Disclaimer: Screenshots of free tiers are taken in August 2024\. Check for changes before deploying. Author of this repo is not responsible for any costs occurring through using any of the material in this repo. The document solely describes the author’s experience with free cloud offerings.

Why the name Pita? That’s a longer discussion. For now just so much: I love sourdough.

Over the past years I gained quite a bit of experience with architecting, developing, running and managing lightly used applications basically for free. By "lightly used" I'm referring to the amount of work like transactions or HTTP requests they serve and by "free" I mean for a handful of cents per day max. While the applications are not used heavily they don't want to compromise on professionalism. They deserve proper ci/cd, observability and most importantly high availability and resilience. 

Nowadays it all starts with data, right? So we can't compromise on our data-layer. Therefor I choose CockroachDB and luckily there is a free tier available: https://cockroachlabs.cloud/signup https://www.cockroachlabs.com/pricing/  
As you can see: No credit card required and for zero dollars you can roughly execute 10 SQL queries/s 24 by 7\. Great\! Love it. Way more than most of my light apps need and the distributed nature of CockroachDB guarantees the high-availability and resilience of my data layer. Also pretty cool to have a RDBMS always available with a SQL-shell ready waiting for you if you quickly want to test a query\! Data-layer? Solved.

![](https://storage.googleapis.com/thegym-public/cockroachcloudfree.png)  
Let's continue with our shopping list:  
\- Developer tooling & IDE: Google Cloud Shell  
\- Repo: Github  
\- Observability: Grafana Cloud for metrics, logs & traces  
\- Synthetic monitoring: Grafana Cloud  
\- CI/CD: Google Cloud Build  
\- Authentication: Sign In With Google, CockroachDB as backend  
\- Runtime: Google Cloud Run   
\- Database: Clockroach Cloud Free Tier

So what we get for free looks like the following:  
![](https://storage.googleapis.com/thegym-public/pita.drawio.png)

You might wonder about the programming language we are going to use: I mostly use Node but we will eventually run a docker container so what I describe is applicable as long as it runs in docker.

As we need to have an example app this repo contains an enhanced “Hello Web” application called Pita. Users can sign in (with Google) and if they are authorized can add notes to a single page. Notes are persisted in the database and retrieved from there. A pretty vanilla web-app. 

I'm biased and choose Google and Grafana because of my personal experience but I think other parents have nice children too: AWS Fargate, Azure Containers, etc. But you want to check if the service you use is part of a free tier. Cloud Run and Build are both part of Google's free tier (2 mio requests per month, 120 build-minutes per day). Grafana Cloud gives me 10k metrics, 50GB of logs & traces.

![](https://storage.googleapis.com/thegym-public/googlecloudfree.png)       
![](https://storage.googleapis.com/thegym-public/grafanacloudfree.png)

You might wonder why Google Cloud shell? I just love it. A (8GB) VM with most developer tools always waiting for you. You can even run a minikube cluster in it. Would love to see a Cockroachdb pre-installed though. But given CockroachDB is a single binary it’s a trivial download & installation should I need a local one. Having said that, I use the cloud version most of the time anyway. Back to Google Cloud Shell: By using it for this exercise all we need is a browser. Cloud shell requires you to have a free Google Mail account though.  

![](https://storage.googleapis.com/thegym-public/googlecloudshell.png)

Should you sign-up to Google Cloud just now, be advised that your clock for the 3 month credits is ticking. The setup outlined here should not tap into the credits so use them for other experiments\!

Advice: Setup a budget and budget alerts\! This is available under “Billing” in the GCP console. 

After signing up to all the services required and if you are ready to roll, fire up your IDE or cloud shell and start building your app and a Dockerfile for it. Commit it to github. 

Talking about Docker… I know it’s not the purist’s vision but for our purposes we need to actually run more than one process in the container:

1. Your app  
2. The Grafana agent (now known under the name Alloy)  
3. Nginx

The app is obvious, the Grafana agent for convenience. You could alternatively build your app in a way that it is directly sending metrics, logs & tracing to Grafana cloud but I prefer to keep things separated. Why Nginx?  Well Cloud Run injects it’s own tracing headers in to the HTTP headers and this confuses Grafana Tempo so we need a way to get rid of them and Nginx is doing this for us (excerpt from nginx.conf):  
   …  
   server {  
       listen 0.0.0.0:3000;  
       proxy\_set\_header x-cloud-trace-context "";  
       proxy\_set\_header grpc-trace-bin "";  
       proxy\_set\_header traceparent "";  
   …

My Dockerfile basically looks like this:  
FROM node:hydrogen

WORKDIR /opt/app

RUN curl \-LJO https://github.com/grafana/agent/releases/download/v0.39.0-rc.0/grafana-agent-linux-amd64.zip  
RUN unzip grafana-agent-linux-amd64.zip  
RUN chmod \+x grafana-agent-linux-amd64.zip

RUN apt-get update \-y  
RUN apt-get install \--yes nginx

COPY app.js /opt/app  
\# Omitted: Copy rest of app  
COPY nginx.conf /etc/nginx/nginx.conf  
COPY grafana-agent-config.yaml /opt/app

RUN chmod \+x /opt/app/start.sh

RUN cd /opt/app; npm install

ENTRYPOINT /opt/app/start.sh

And then the above references start.sh script looks like this:  
cd /opt/app  
/usr/sbin/nginx

/opt/app/grafana-agent-linux-amd64  \-config.expand-env \-enable-features integrations-next \--config.file /opt/app/grafana-agent-config.yaml  \> $LOGFOLDER/grafana.log 2\>&1 &

node \--require @opentelemetry/auto-instrumentations-node/register ./bin/www

It starts nginx using our configuration which Docker copied to /etc/nginx/nginx.conf and then starts the Grafana agent before finally starting our application with the open telemetry auto-instrumentation. Should you use something else than node the start of your application obviously looks different. 

Now what makes Cloud Run run so efficiently that it can be offered by Google for free (within it’s limits) is the fact that it scales down to zero when not used. No request being worked on by the app, no CPU. This makes things a bit tough with our Grafana agent which should collect metrics every 15s because it might not be on CPU. Therefore I do a bit of a trick in my app: Whenever I’m done handling a request the application starts another request asynchronously which just sleeps for a bit more than the metrics collection interval. 15s in my case which gives the Grafana agent enough CPU to collect metrics at least once after each request. Neat trick, isn’t it? Which also means no request at all: No metrics either. So we set up a synthetic transaction in Grafana Cloud to access our app once per metrics collection interval. Which should result in metrics being collected 24 by 7\.

router.get('/app/pita.html', async function (req, res, next) {  
   let start \= new Date();  
   res.render('pita', { user: global.getUser(req)});  
   global.httpRequestDurationMilliseconds  
     .labels(req.route.path, res.statusCode, req.method)  
     .observe(new Date() \- start);  
   setTimeout(global.sleepRequest, 10);  
 });  
 global.sleepRequest\= async function () {   
 await axios.get(process.env.SLEEPURL);  
}

router.get("/sleep", async function (req, res, next) {  
 await sleep(process.env.SLEEP)  
 res.send("ok");  
});

async function sleep(ms) {  
 return new Promise((resolve) \=\> {  
   setTimeout(resolve, ms);  
 });  
};  
