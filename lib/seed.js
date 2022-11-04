const axios = require("axios")
const { s3Client } = require("./s3")
const { PutObjectCommand } = require("@aws-sdk/client-s3")
const { insertItem } = require("./db")

const BUCKET_URL =
  `https://${process.env.S3_BUCKET}.s3.ap-southeast-2.amazonaws.com/`

const uploadFromUrl = async (imageName, imageURL) => {
  const fetchResponse = await axios.get(encodeURI(imageURL), {
    responseType: "arraybuffer",
  })

  const bucketParams = {
    Bucket: process.env.S3_BUCKET,
    Key: imageName,
    Body: fetchResponse.data,
    ACL: "public-read",
  }

  try {
    await s3Client.send(new PutObjectCommand(bucketParams))
    return bucketParams.Bucket + "/" + bucketParams.Key
  } catch (err) {
    console.log("Error uploading image", err)
    return undefined
  }
}

const seedPokemonFromApi = async () => {
  // get and store the first 2 generations of pokemon only
  const insertPromises = []
  for (let i = 1; i <= 251; i++) {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${i}`)
    const pokemon = response?.data
    if (!pokemon) {
      console.log(`${i} skipped doesnt exist`)
      continue // if doesnt exist, dont want it
    }

    const imageUrl = pokemon?.sprites?.other?.['official-artwork']?.front_default
    if (!imageUrl) {
      console.log(`${i} skipped no image`)
      continue // if doesnt exist, dont want it
    }

    const imageName = imageUrl.match(
      /[^/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/
    )?.[0];

    await uploadFromUrl(imageName, imageUrl)

    insertPromises.push(
        insertItem(process.env.POKEMON_TABLE, {
          PK: { N: `${i}` },
          SK: { N: `${i}` },
          name: { S: pokemon.name },
          imageUrl: { S: imageName ? BUCKET_URL + imageName : imageUrl },
        })
      )
      console.log(`${i} added`)
  }
  try {
    await Promise.all(insertPromises)
  } catch (err) {
    console.log("error inserting pokemon into table")
    throw err
  }
}

const seedData = async () => {
  try {
    await seedPokemonFromApi()
    return "table seeded"
  } catch (err) {
    throw err
  }
}

exports.seedData = seedData