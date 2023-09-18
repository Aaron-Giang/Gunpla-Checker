terraform {
  required_providers {
    aws = {
      version = ">= 4.0.0"
      source  = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = "us-east-2"
}


resource "aws_dynamodb_table" "gunplaData" {
    name = "gunplaData"
    billing_mode = "PROVISIONED"
    hash_key = "index"
    range_key = "model_name"
    read_capacity = 25
    write_capacity = 25

    attribute {
        name = "index"
        type = "S"
    }

    attribute {
        name = "model_name"
        type = "S"
    }

}


#getData Stuff-------------------------------------------------------------------------------------------------------------------------------------------------------

resource "aws_iam_role" "lambda-get" {
  name               = "iam-for-lambda-get"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

# create archive file from main.py
data "archive_file" "lambda-get" {
  type = "zip"
  source_dir = "../functions/getData"
  output_path = "getData.zip"
}

# create a Lambda function
# see the docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function
resource "aws_lambda_function" "getData" {
  role             = aws_iam_role.lambda-get.arn
  function_name    = "getData"
  handler          = "main.lambda_handler"
  filename         = "getData.zip"
  source_code_hash = data.archive_file.lambda-get.output_base64sha256
  timeout = 20 
  # see all available runtimes here: https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime
  runtime = "python3.9"
}


#creating a policy and attaching it 
resource "aws_iam_policy" "logs_get" {
  name        = "iam-getData"
  description = "IAM policy for logging from a lambda"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "dynamodb:*",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ],
        Resource = [
          "arn:aws:logs:*:*:*",
          aws_dynamodb_table.gunplaData.arn
        ],
        Effect = "Allow"
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "custom_policy_get_attach" {
  policy_arn = aws_iam_policy.logs_get.arn
  role       = aws_iam_role.lambda-get.name
}

#creating url to get data
resource "aws_lambda_function_url" "get_data_url" {
    function_name      = aws_lambda_function.getData.function_name
    authorization_type = "NONE"

    cors {
      allow_credentials = true
      allow_origins     = ["*"]
      allow_methods     = ["GET"]
      allow_headers     = ["*"]
    }
}

output "get_data_url" {
    value = aws_lambda_function_url.get_data_url.function_url
}


#refreshData Stuff---------------------------------------------------------------------------------------------------------------------------------------------------

resource "aws_iam_role" "lambda-refresh" {
  name               = "iam-for-lambda-refresh"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

# create archive file from main.py
data "archive_file" "lambda-refresh" {
  type = "zip"
  source_dir = "../functions/refreshData"
  output_path = "refreshData.zip"
}

# create a Lambda function
# see the docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function
resource "aws_lambda_function" "refreshData" {
  role             = aws_iam_role.lambda-refresh.arn
  function_name    = "refreshData"
  handler          = "main.lambda_handler"
  filename         = "refreshData.zip"
  source_code_hash = data.archive_file.lambda-refresh.output_base64sha256
  timeout = 900 
  # see all available runtimes here: https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#SSS-CreateFunction-request-Runtime
  runtime = "python3.9"
}


#creating a policy and attaching it 
resource "aws_iam_policy" "logs_refresh" {
  name        = "iam-refreshData"
  description = "IAM policy for logging from a lambda"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "dynamodb:*",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ],
        Resource = [
          "arn:aws:logs:*:*:*",
          aws_dynamodb_table.gunplaData.arn
        ],
        Effect = "Allow"
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "custom_policy_refresh_attach" {
  policy_arn = aws_iam_policy.logs_refresh.arn
  role       = aws_iam_role.lambda-refresh.name
}


