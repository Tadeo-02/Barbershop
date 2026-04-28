# Deployment Guides for Specific Platforms

## Table of Contents

1. [Railway.app](#railwayapp) - ⭐ Recommended for simplicity
2. [AWS ECS](#aws-ecs) - For scalable production
3. [Google Cloud Run](#google-cloud-run)
4. [Azure Container Instances](#azure-container-instances)
5. [Docker Hub + Manual Deployment](#docker-hub--manual-deployment)
6. [DigitalOcean App Platform](#digitalocean-app-platform)

---

## Railway.app

**Best for:** Quick deployment, minimal DevOps knowledge, free tier available

### Setup (5 minutes)

1. **Push your code to GitHub**

   ```bash
   git push origin main
   ```

2. **Go to [railway.app](https://railway.app)**
   - Create account (connect GitHub)
   - Click "New Project"
   - Select "Deploy from GitHub repo"

3. **Configure Environment**
   - In Railway dashboard, go to "Variables"
   - Add from `.env.example`:
     ```
     NODE_ENV=production
     DATABASE_URL=postgresql://... (Railway generates this)
     AFIP_ACCESS_TOKEN=...
     AFIP_CUIT=...
     ```

4. **Add MySQL Service**
   - Click "Add" → "Add from marketplace"
   - Select "MySQL"
   - Railway auto-configures DATABASE_URL

5. **Deploy**
   - Railway auto-deploys on every git push
   - View logs in dashboard
   - Domain assigned automatically

### Cost

- **Free tier:** 500 hours/month (~$5 after)
- **Pro:** Pay-as-you-go, very reasonable

### Monitoring

- Dashboard shows logs, metrics
- Email alerts on failures
- GitHub PR deployments

---

## AWS ECS

**Best for:** Production enterprise deployments, high scale

### Prerequisites

- AWS account
- AWS CLI configured: `aws configure`

### Step 1: Create ECR Repository

```bash
# Create repository for backend
aws ecr create-repository \
  --repository-name barbershop-backend \
  --region us-east-1

# Create repository for frontend
aws ecr create-repository \
  --repository-name barbershop-frontend \
  --region us-east-1

# Get login credentials
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### Step 2: Build and Push Images

```bash
# Build backend
docker build -f Dockerfile.backend -t barbershop-backend:latest .
docker tag barbershop-backend:latest \
  ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/barbershop-backend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/barbershop-backend:latest

# Build frontend
docker build -f Dockerfile.frontend -t barbershop-frontend:latest .
docker tag barbershop-frontend:latest \
  ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/barbershop-frontend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/barbershop-frontend:latest
```

### Step 3: Setup RDS MySQL

```bash
aws rds create-db-instance \
  --db-instance-identifier barbershop-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password YourStrongPassword123 \
  --allocated-storage 20 \
  --backup-retention-period 7 \
  --multi-az
```

### Step 4: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name barbershop-cluster

# Create task execution role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://trust-policy.json
```

### Step 5: Register Task Definition

Create `task-definition.json`:

```json
{
  "family": "barbershop-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/barbershop-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "mysql://user:pass@rds-endpoint:3306/barbershop"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/barbershop-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    },
    {
      "name": "frontend",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/barbershop-frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/barbershop-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register the task:

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json
```

### Step 6: Create Service

```bash
aws ecs create-service \
  --cluster barbershop-cluster \
  --service-name barbershop-service \
  --task-definition barbershop-app:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=frontend,containerPort=3000
```

### Step 7: Setup ALB (Load Balancer)

- Create Application Load Balancer in EC2 console
- Configure target groups for backend (3001) and frontend (3000)
- Create listener rules to route traffic

### Cost

- **Fargate:** ~$0.032/hour per vCPU + ~$0.007/hour per GB RAM
- **RDS db.t3.micro:** ~$30/month
- Typical setup: $200-500/month

---

## Google Cloud Run

**Best for:** Serverless, pay-per-use, minimal infrastructure

### Prerequisites

- Google Cloud account
- `gcloud` CLI installed

### Step 1: Setup Project

```bash
# Create project
gcloud projects create barbershop-app

# Set as active
gcloud config set project barbershop-app

# Enable APIs
gcloud services enable containerregistry.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
```

### Step 2: Create Cloud SQL Instance

```bash
gcloud sql instances create barbershop-mysql \
  --database-version MYSQL_8_0 \
  --tier db-f1-micro \
  --region us-central1

# Create database
gcloud sql databases create barbershop \
  --instance barbershop-mysql

# Create user
gcloud sql users create barbershop_user \
  --instance barbershop-mysql \
  --password=YourStrongPassword123
```

### Step 3: Build and Push Images

```bash
# Build backend
docker build -f Dockerfile.backend -t gcr.io/barbershop-app/backend:latest .
docker push gcr.io/barbershop-app/backend:latest

# Build frontend
docker build -f Dockerfile.frontend -t gcr.io/barbershop-app/frontend:latest .
docker push gcr.io/barbershop-app/frontend:latest
```

### Step 4: Deploy Services

```bash
# Deploy backend
gcloud run deploy barbershop-backend \
  --image gcr.io/barbershop-app/backend:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=mysql://user:pass@cloudsql/barbershop

# Deploy frontend
gcloud run deploy barbershop-frontend \
  --image gcr.io/barbershop-app/frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Cost

- **Cloud Run:** Free tier (2M requests/month), then $0.40 per million
- **Cloud SQL:** Starts ~$7/month

---

## Azure Container Instances

**Best for:** Microsoft ecosystem, hybrid deployments

### Prerequisites

- Azure account
- Azure CLI: `az login`

### Step 1: Create Resource Group

```bash
az group create \
  --name barbershop-rg \
  --location eastus
```

### Step 2: Create Container Registry

```bash
az acr create \
  --resource-group barbershop-rg \
  --name barbershopregistry \
  --sku Basic

# Login
az acr login --name barbershopregistry
```

### Step 3: Build and Push

```bash
# Build backend
docker build -f Dockerfile.backend -t barbershopregistry.azurecr.io/backend:latest .
docker push barbershopregistry.azurecr.io/backend:latest

# Build frontend
docker build -f Dockerfile.frontend -t barbershopregistry.azurecr.io/frontend:latest .
docker push barbershopregistry.azurecr.io/frontend:latest
```

### Step 4: Create MySQL Database

```bash
az mysql server create \
  --resource-group barbershop-rg \
  --name barbershop-mysql \
  --location eastus \
  --admin-user dbadmin \
  --admin-password YourStrongPassword123 \
  --sku-name B_Gen5_1
```

### Step 5: Deploy Containers

```bash
# Get ACR credentials
ACR_LOGIN=$(az acr credential show \
  --name barbershopregistry \
  --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show \
  --name barbershopregistry \
  --query "passwords[0].value" -o tsv)

# Deploy backend
az container create \
  --resource-group barbershop-rg \
  --name barbershop-backend \
  --image barbershopregistry.azurecr.io/backend:latest \
  --registry-login-username $ACR_LOGIN \
  --registry-login-password $ACR_PASSWORD \
  --ports 3001 \
  --environment-variables NODE_ENV=production

# Deploy frontend
az container create \
  --resource-group barbershop-rg \
  --name barbershop-frontend \
  --image barbershopregistry.azurecr.io/frontend:latest \
  --registry-login-username $ACR_LOGIN \
  --registry-login-password $ACR_PASSWORD \
  --ports 3000
```

### Cost

- **Container Instances:** ~$0.0000193 per second (1vCPU, 1GB RAM)
- **Azure Database:** ~$32/month

---

## Docker Hub + Manual Deployment

**Best for:** VPS/Dedicated server, full control

### Step 1: Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag and push backend
docker tag barbershop-backend:latest username/barbershop-backend:latest
docker push username/barbershop-backend:latest

# Tag and push frontend
docker tag barbershop-frontend:latest username/barbershop-frontend:latest
docker push username/barbershop-frontend:latest
```

### Step 2: Setup Server

```bash
# SSH into your server
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3: Deploy

```bash
# Clone repository
git clone https://github.com/yourusername/barbershop.git
cd barbershop

# Create .env
cp .env.example .env
# Edit .env with production values
nano .env

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### Cost

- **VPS:** $5-50/month depending on specs

---

## DigitalOcean App Platform

**Best for:** Simple managed deployments, generous free tier

### Step 1: Connect GitHub

- Go to DigitalOcean Apps
- Click "Create App"
- Connect GitHub repository

### Step 2: Configure Services

- DigitalOcean auto-detects Docker files
- Configure environment variables
- Add database service (MySQL managed)

### Step 3: Deploy

- Click "Deploy"
- Automatic CI/CD on git push
- Domains assigned automatically

### Cost

- **Free tier:** $12 credit/month (covers small app)
- **Pro:** Pay-as-you-go ($5-20/month typical)

---

## Summary Comparison

| Platform     | Ease   | Cost | Scalability | Best For                   |
| ------------ | ------ | ---- | ----------- | -------------------------- |
| Railway      | ⭐⭐⭐ | $    | Medium      | Startups, rapid deployment |
| AWS ECS      | ⭐     | $$   | ⭐⭐⭐      | Enterprise, high scale     |
| Cloud Run    | ⭐⭐   | $$   | ⭐⭐⭐      | Serverless, variable load  |
| Azure        | ⭐⭐   | $$   | ⭐⭐        | Microsoft ecosystem        |
| VPS          | ⭐⭐   | $    | ⭐⭐        | Full control, DIY          |
| DigitalOcean | ⭐⭐⭐ | $    | ⭐⭐        | Balanced, easy             |

---

**Recommended Path:**

1. **Start:** Railway.app or DigitalOcean (easy, affordable)
2. **Grow:** Upgrade to managed services (RDS, Cloud SQL)
3. **Scale:** Migrate to Kubernetes or AWS ECS

---

_Last Updated: April 2026_
