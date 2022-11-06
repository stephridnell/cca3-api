const express = require('express')
const cors = require('cors')
const serverless = require('serverless-http')
// const { seedData } = require('./lib/seed.js')
const { getAllPokemon } = require('./lib/db.js')
const userRoutes = require('./routes/user.js')
const gameRoutes = require('./routes/game.js')

const app = express()
app.use(cors({
  origin: '*',
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', async (req, res) => {
  res.send({ hello: 'there' })
})

app.use('/auth', userRoutes)
app.use('/game', gameRoutes)

app.get('/pokemon', async function (req, res) {
  const pokemon = await getAllPokemon()
  // removing any multiwork pokemon (includes -) makes the game too hard for
  // answers like nidoran-m and nidoran-f
  res.json({ pokemon: pokemon.filter(el => !el.name.includes('-')) })
})

// commented out because this doesn't really need to be run again
// app.post('/seed-pokemon', async function (req, res) {
//   await seedData()
//   res.sendStatus(201)
// })

app.use((req, res, next) => {
  return res.status(404).json({
    error: 'Not Found',
  })
})

module.exports.handler = serverless(app)
