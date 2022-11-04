const express = require('express')
const cors = require('cors')
const serverless = require('serverless-http')
// const { seedData } = require('./lib/seed.js')
const { getAllPokemon, getLoginUser, insertItem } = require('./lib/db.js')
const bcrypt = require('bcryptjs')
const { v4 } = require('uuid')

const app = express()
app.use(cors({
  origin: '*',
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', async (req, res) => {
  res.send({ hello: 'there' });
});

app.get('/pokemon', async function (req, res) {
  const pokemon = await getAllPokemon()
  res.json({ pokemon })
})

// commented out because this doesn't really need to be run again
// app.post('/seed-pokemon', async function (req, res) {
//   await seedData()
//   res.sendStatus(201)
// })

app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ msg: 'Missing required field' });
  }

  // check if email already exists in DB
  const userByEmail = await getLoginUser(email);
  if (userByEmail) {
    return res.status(400).json({ msg: 'A user with this email already exists' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const userId = 'u#' + v4()

  try {
    await insertItem(process.env.USERS_TABLE, {
      PK: { S: userId },
      SK: { S: userId },
      name: { S: name },
      email: { S: email },
      password: { S: hashedPassword },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: 'Unexpected error occurred' });
  }

  return res.sendStatus(201);
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: 'Not Found',
  })
})

module.exports.handler = serverless(app);
