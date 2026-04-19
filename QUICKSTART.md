# OrganizeMe - Docker Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Prerequisites
- Docker and Docker Compose installed
- Git

### Step 1: Clone and Setup

```bash
git clone <repository-url>
cd OrganizeMe
cp .env.example .env
```

### Step 2: Start Everything

**Option A: Simple Start**
```bash
docker-compose up -d
```

**Option B: Using Interactive Script**
```bash
./docker-manage.sh
# Select option 1 to start services
```

### Step 3: Access Your App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: postgres://localhost:5432
- **Jenkins**: http://localhost:8080 (admin/admin123)

That's it! 🎉

## CI/CD with Jenkins

Jenkins is included for continuous integration and deployment:

```bash
# Start Jenkins
docker-compose up -d jenkins

# Access Jenkins at http://localhost:8080
# Default credentials: admin / admin123

# Run the pre-configured pipeline
# Go to Jenkins UI -> organizeme-build -> Build Now
```

## Infrastructure as Code with Terraform

Terraform is included for infrastructure provisioning on AWS:

```bash
# Initialize Terraform
docker-compose exec terraform terraform init

# Plan infrastructure changes
docker-compose exec terraform terraform plan

# Apply changes (creates VPC, EC2 instances for Jenkins and App)
docker-compose exec terraform terraform apply

# Get outputs (public IPs)
docker-compose exec terraform terraform output
```

### AWS Deployment Steps

1. **Configure AWS Credentials**:
   ```bash
   aws configure
   # Or set environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
   ```

2. **Customize Variables**:
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your settings
   ```

3. **Create SSH Key Pair** (in AWS Console):
   - EC2 → Key Pairs → Create key pair
   - Name: `organizeme-key`
   - Download and save the .pem file

4. **Deploy to AWS**:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

5. **Access Deployed Services**:
   - Jenkins: `http://<jenkins-ip>:8080`
   - App: `http://<app-ip>:3000`

### AWS Resources Created

- VPC with public subnet
- Security groups for Jenkins and app
- EC2 instances with Docker, Jenkins, and your app
- Elastic IPs for public access
- Internet Gateway and routing

## Common Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Access database
docker-compose exec postgres psql -U admin -d organizeme

# View status
docker-compose ps
```

## Troubleshooting

### Port Already in Use
Edit `.env` and change:
```env
PORT=5001
FRONTEND_PORT=3001
DB_PORT=5433
```

### Database Connection Error
Wait a few seconds for PostgreSQL to start:
```bash
docker-compose logs postgres
```

### Clear Everything and Start Fresh
```bash
docker-compose down -v
docker-compose up -d
```

## Next Steps

- See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed documentation
- Configure database credentials in `.env`
- Update API endpoints for production
- Set up environment-specific configs

## Help

For detailed information, see:
- [Full Docker Setup Guide](DOCKER_SETUP.md)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- Project README.md
