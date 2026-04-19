# AWS Region
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

# Environment
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# Instance Type
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

# AMI ID (Amazon Linux 2 in us-east-1)
variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-0c7217cdde317cfec"
}

# Key Pair Name (you'll need to create this in AWS)
variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = "organizeme-key"
}