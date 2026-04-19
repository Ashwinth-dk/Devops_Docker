# Terraform AWS Deployment for OrganizeMe

This directory contains Terraform configuration to deploy the OrganizeMe application to AWS.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured:
   ```bash
   aws configure
   ```
3. **SSH Key Pair** created in AWS Console (EC2 → Key Pairs)

## Quick Start

1. **Configure Variables**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your settings
   ```

2. **Initialize and Deploy**:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

3. **Get Access URLs**:
   ```bash
   terraform output
   ```

## Resources Created

- **VPC** with public subnet and internet gateway
- **Security Groups** for Jenkins and application traffic
- **EC2 Instances**:
  - Jenkins server (with Docker, Jenkins, Terraform)
  - Application server (with Docker Compose stack)
- **Elastic IPs** for public access

## Access Information

After deployment, you'll get:
- Jenkins URL: `http://<jenkins-ip>:8080`
- Application URL: `http://<app-ip>:3000`
- SSH access: `ssh -i organizeme-key.pem ec2-user@<instance-ip>`

## Configuration

### Variables

| Variable | Description | Default |
|----------|-------------|---------|
| aws_region | AWS region | us-east-1 |
| environment | Environment name | dev |
| instance_type | EC2 instance type | t3.medium |
| ami_id | AMI ID for Amazon Linux 2 | ami-0c7217cdde317cfec |
| key_name | SSH key pair name | organizeme-key |

### Security Notes

- SSH access is open to 0.0.0.0/0 - restrict to your IP in production
- Database port (5432) is only accessible within VPC
- Web ports (80, 443, 3000, 5000) are open to internet

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

## Troubleshooting

- **AMI not found**: Update `ami_id` for your region
- **Key pair not found**: Create key pair in AWS Console
- **Permissions**: Ensure your AWS user has EC2, VPC, and IAM permissions