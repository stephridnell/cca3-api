const { S3Client } = require("@aws-sdk/client-s3")
const REGION = "ap-southeast-2"
const config = {
  region: REGION,
}
const s3Client = new S3Client(config)
exports.s3Client = s3Client
