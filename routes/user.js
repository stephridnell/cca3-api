const express = require('express')
const { getLoginUser, insertItem } = require('../lib/db.js')
const bcrypt = require('bcryptjs')
const { v4 } = require('uuid')

const router = express.Router()

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ msg: 'Missing required field' })
  }

  // check if email already exists in DB
  const userByEmail = await getLoginUser(email)
  if (userByEmail) {
    return res.status(400).json({ msg: 'A user with this email already exists' })
  }

  const salt = bcrypt.genSaltSync(10)
  const hashedPassword = bcrypt.hashSync(password, salt)
  const userId = 'u#' + v4()

  try {
    await insertItem(process.env.USERS_TABLE, {
      PK: userId,
      SK: userId,
      name: name,
      email: email,
      password: hashedPassword,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({ msg: 'Unexpected error occurred' })
  }

  return res.sendStatus(201)
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ msg: 'Invalid email or password' })
  }

  const user = await getLoginUser(email)
  if (user) {
    const validPassword = bcrypt.compareSync(password, user.password)
    if (!validPassword) {
      return res.status(400).json({ msg: 'Invalid email or password' })
    }
  }

  return res.status(200).json({ user: {
    ...user,
    password: undefined
  } })
})

module.exports = router
