# Terraform configuration for OrganizeMe infrastructure
# This is a basic example - customize for your cloud provider

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  default     = "dev"
}

# VPC for the application
resource "aws_vpc" "organizeme_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "organizeme-${var.environment}-vpc"
  }
}

# Subnet
resource "aws_subnet" "organizeme_subnet" {
  vpc_id     = aws_vpc.organizeme_vpc.id
  cidr_block = "10.0.1.0/24"

  tags = {
    Name = "organizeme-${var.environment}-subnet"
  }
}

# Security group for web traffic
resource "aws_security_group" "organizeme_sg" {
  name_prefix = "organizeme-"
  vpc_id      = aws_vpc.organizeme_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict to your IP in production
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Frontend port
  }

  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Backend port
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]  # Database - internal only
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "organizeme-${var.environment}-sg"
  }
}

# Security group for Jenkins
resource "aws_security_group" "jenkins_sg" {
  name_prefix = "jenkins-"
  vpc_id      = aws_vpc.organizeme_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict to your IP in production
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Jenkins web interface
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "jenkins-${var.environment}-sg"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "organizeme_igw" {
  vpc_id = aws_vpc.organizeme_vpc.id

  tags = {
    Name = "organizeme-${var.environment}-igw"
  }
}

# Route Table
resource "aws_route_table" "organizeme_rt" {
  vpc_id = aws_vpc.organizeme_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.organizeme_igw.id
  }

  tags = {
    Name = "organizeme-${var.environment}-rt"
  }
}

# Route Table Association
resource "aws_route_table_association" "organizeme_rta" {
  subnet_id      = aws_subnet.organizeme_subnet.id
  route_table_id = aws_route_table.organizeme_rt.id
}

# EC2 instance for Jenkins
resource "aws_instance" "jenkins" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name
  subnet_id     = aws_subnet.organizeme_subnet.id
  vpc_security_group_ids = [aws_security_group.jenkins_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker git
              systemctl start docker
              systemctl enable docker
              usermod -a -G docker ec2-user

              # Install Docker Compose
              curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose

              # Install Jenkins
              wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
              rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
              yum install -y jenkins java-11-amazon-corretto-headless
              systemctl start jenkins
              systemctl enable jenkins

              # Install Terraform
              yum install -y yum-utils
              yum-config-manager --add-repo https://rpm.releases.hashicorp.com/AmazonLinux/hashicorp.repo
              yum install -y terraform
              EOF

  tags = {
    Name = "organizeme-${var.environment}-jenkins"
  }
}

# EC2 instance for the application
resource "aws_instance" "app" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name
  subnet_id     = aws_subnet.organizeme_subnet.id
  vpc_security_group_ids = [aws_security_group.organizeme_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker git
              systemctl start docker
              systemctl enable docker
              usermod -a -G docker ec2-user

              # Install Docker Compose
              curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose

              # Install Terraform
              yum install -y yum-utils
              yum-config-manager --add-repo https://rpm.releases.hashicorp.com/AmazonLinux/hashicorp.repo
              yum install -y terraform

              # Clone and setup the application
              cd /home/ec2-user
              git clone https://github.com/yourusername/organizeme.git
              cd organizeme
              cp .env.example .env
              # Edit .env with appropriate values for AWS

              # Start the application
              docker-compose up -d --build
              EOF

  tags = {
    Name = "organizeme-${var.environment}-app"
  }
}

# Elastic IP for Jenkins
resource "aws_eip" "jenkins_eip" {
  instance = aws_instance.jenkins.id
  vpc      = true

  tags = {
    Name = "organizeme-${var.environment}-jenkins-eip"
  }
}

# Elastic IP for App
resource "aws_eip" "app_eip" {
  instance = aws_instance.app.id
  vpc      = true

  tags = {
    Name = "organizeme-${var.environment}-app-eip"
  }
}

# Output the VPC ID
output "vpc_id" {
  value = aws_vpc.organizeme_vpc.id
}

output "subnet_id" {
  value = aws_subnet.organizeme_subnet.id
}

output "security_group_id" {
  value = aws_security_group.organizeme_sg.id
}

output "jenkins_public_ip" {
  value = aws_eip.jenkins_eip.public_ip
}

output "app_public_ip" {
  value = aws_eip.app_eip.public_ip
}

output "jenkins_url" {
  value = "http://${aws_eip.jenkins_eip.public_ip}:8080"
}

output "app_url" {
  value = "http://${aws_eip.app_eip.public_ip}:3000"
}
