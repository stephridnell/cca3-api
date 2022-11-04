const express = require('express')
const { insertItem, getUser, getPreviousHighScore, getLeaderboard } = require('../lib/db.js')
const { v4 } = require('uuid')

const router = express.Router()

router.post('/end', async (req, res) => {
  const { userId, results } = req.body
  // results type: (not using TS so not to self)
  // { pokemon: string, correct: boolean }[]

  if (!userId) {
    return res.status(400).json({ msg: 'User id required to end game' })
  }

  // make sure legit user
  const userExists = await getUser(userId)
  if (!userExists) {
    return res.status(400).json({ msg: 'User does not exist' })
  }

  // calculate score based on how many were correct
  const score = results.reduce((prev, curr) => {
    if (curr.correct) prev++
    return prev
  }, 0)

  const gameId = 'g#' + v4()

  // store game results
  try {
    await insertItem(process.env.USERS_TABLE, {
      PK: userId,
      SK: gameId,
      score,
      results,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({ msg: 'Unexpected error occurred' })
  }

  // update leaderboard
  const previousHighScore = await getPreviousHighScore(userId)
  console.log('previousHighScore', previousHighScore, score)
  if (previousHighScore < score) {
    try {
      await insertItem(process.env.USERS_TABLE, {
        PK: 'leaderboard',
        SK: userId,
        score: score
      })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ msg: 'Unexpected error occurred' })
    }
  }

  return res.sendStatus(201)
})

router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await getLeaderboard()
    res.json(leaderboard)
  } catch (err) {
    console.log(err)
    return res.status(500).json({ msg: 'Unexpected error occurred' })
  }
})

module.exports = router
