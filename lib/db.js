const {
  DeleteItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} = require("@aws-sdk/client-dynamodb")
const { ddbClient } = require("./ddb")
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");


exports.insertItem = async (tableName, item) => {
  const params = {
    TableName: tableName,
    Item: marshall(item),
  }

  const command = new PutItemCommand(params)
  await ddbClient.send(command)
}

exports.deleteItem = async (tableName, deleteKey) => {
  const params = {
    TableName: tableName,
    Key: deleteKey,
  }

  const command = new DeleteItemCommand(params)
  await ddbClient.send(command)
}

exports.getAllPokemon = async () => {
  const params = {
    TableName: process.env.POKEMON_TABLE,
    
  }
  try {
    const data = await ddbClient.send(new ScanCommand(params))
    if (!data.Items) {
      return []
    }

    return data.Items.map((pokemon) => {
      return {
        id: Number(pokemon.PK.N),
        name: pokemon.name.S,
        imageUrl: pokemon.imageUrl.S,
      }
    }).sort((a, b) => {
      return a.id < b.id ? -1 : 1
    })
  } catch (err) {
    console.log("Error", err)
    throw err
  }
}


exports.getLoginUser = async (email) => {
  var params = {
    KeyConditionExpression: "email = :e",
    ExpressionAttributeValues: {
      ":e": { S: email },
    },
    IndexName: "byEmail",
    TableName: process.env.USERS_TABLE,
  }

  const command = new QueryCommand(params)
  const response = await ddbClient.send(command)
  const userData = response.Items?.[0]
  if (!userData) {
    return undefined
  }

  const unmarshalledUser = unmarshall(userData)

  return {
    userId: unmarshalledUser.PK,
    password: unmarshalledUser.password,
    email: unmarshalledUser.email,
    name: unmarshalledUser.name,
  }
}


exports.checkUserExists = async (userId) => {
  var params = {
    KeyConditionExpression: "PK = :uid",
    ExpressionAttributeValues: {
      ":uid": { S: userId },
    },
    TableName: process.env.USERS_TABLE,
  }

  const command = new QueryCommand(params)
  const response = await ddbClient.send(command)
  const userData = response.Items?.[0]
  if (!userData) {
    return false
  }

  return true
}

exports.getPreviousHighScore = async (userId) => {
  var params = {
    KeyConditionExpression: "PK = :lb AND SK = :uid",
    ExpressionAttributeValues: {
      ":lb": { S: 'leaderboard' },
      ":uid": { S: userId },
    },
    TableName: process.env.USERS_TABLE,
  }

  const command = new QueryCommand(params)
  const response = await ddbClient.send(command)
  const userScore = response.Items?.[0]
  if (!userScore) {
    return 0
  }
  const unmarshalledUser = unmarshall(userScore)

  return Number(unmarshalledUser.score)
}