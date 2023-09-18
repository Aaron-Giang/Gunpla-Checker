import boto3   
import json
import boto3.dynamodb 

tableName = "gunplaData"
dynamodb_resource = boto3.resource("dynamodb")
table = dynamodb_resource.Table(tableName)


def lambda_handler(event,contex):
    try:
        res = table.scan()  # Change this line
        data = res["Items"]
        return{
            "statusCode":200,
            "body":json.dumps(data)
        }
    
    except Exception as exp:
        print(exp)
        return{
            "statusCode":500,
            "body":json.dumps({
                "message":str(exp)
            })
        }

