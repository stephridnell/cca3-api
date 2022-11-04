const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")
const REGION = "ap-southeast-2"
const config = {
  region: REGION,
}
const ddbClient = new DynamoDBClient(config)
exports.ddbClient = ddbClient