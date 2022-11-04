const {
  DeleteItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} = require("@aws-sdk/client-dynamodb")
const { ddbClient } = require("./ddb")


exports.insertItem = async (tableName, item) => {
  const params = {
    TableName: tableName,
    Item: item,
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
  };

  const command = new QueryCommand(params);
  const response = await ddbClient.send(command);
  const userData = response.Items?.[0];
  if (!userData) {
    return undefined;
  }

  return {
    userId: userData.PK.S ?? "",
    password: userData.password.S ?? "",
    email: userData.email.S ?? "",
  };
};