# Ever wanted to run an app like a pro but for (nearly) free?

Over the past years I gained quite a bit of experience with architecting, developing, running and managing lightly used applications basically for free. By "lightly used" I'm referring to the amount of work like transactions or HTTP requests they serve and by "free" I mean for a handful of cents per day max. While the applications are not used heavily they don't want to compromise on professionalism. They deserve proper ci/cd, observability and most importantly high availability and resilience. 

Nowadays it all starts with data, right? So we can't compromise on our data-layer. Therefor I choose CockroachDB and luckily there is a free tier available: https://cockroachlabs.cloud/signup https://www.cockroachlabs.com/pricing/  
As you can see: No credit card required and for zero dollars you can roughly execute 20 SQL queries/s 24 by 7\. Great\! Love it. Way more than most of my light apps need and the distributed nature of CockroachDB guarantees the high-availability and resilience of my data layer. Also pretty cool to have a RDBMS always available with a SQL-shell ready waiting for you if you quickly want to test a query\! Data-layer? Solved.

Let's continue with our shopping list:  
\- Developer tooling & IDE: Google Cloud Shell  
\- Repo: Github  
\- Observability: Grafana Cloud for metrics, logs & traces  
\- Synthetic monitoring: Grafana Cloud  
\- CI/CD: Google Cloud Build  
\- Authentication: Sign In With Google   
\- Runtime: Google Cloud Run   
\- Database: Clockroach Cloud Free Tier

You might wonder about the programming language we are going to use: I mostly use Node but we will eventually run a docker container so what I describe is applicable as long as it runs in docker.

I'm biased and choose Google and Grafana because of my personal experience but I think other parents have nice children too: AWS Fargate, Azure Containers, etc. But you want to check if the service you use is part of a free tier. Cloud Run and Build are both part of Google's free tier (2 mio requests per month, 120 build-minutes per day). Grafana Cloud gives me 10k metrics, 50GB of logs & traces.

You might wonder why Google Cloud shell? I just love it. A (8GB) VM with most developers tools always waiting for you. You can even run a minikube cluster in it. Would love to see a Cockroachdb pre-installed though. But given CockroachDB is a single binary it’s a trivial download & installation should I need a local one. Having said that, I use the cloud version most of the time anyway. Back to Google Cloud Shell: By using it for this exercise all we need is a browser. Cloud shell requires you to have a free Google Mail account though.  

