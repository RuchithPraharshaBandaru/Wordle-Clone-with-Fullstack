require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const session = require("express-session")
const MongoStore = require("connect-mongo")
const path = require("path")
const User = require("./models/User")
const Game = require("./models/Game")

const app = express()
const PORT = process.env.PORT || 3000


mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/wordle", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ssl: true,
    tls: true,
    tlsAllowInvalidCertificates: false,
    retryWrites: true,
    w: "majority"
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.error("Connection string used:", process.env.MONGODB_URI ? "[REDACTED]" : "mongodb://localhost:27017/wordle");
    process.exit(1); // Exit if we can't connect to database
  });


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))


app.use(
  session({
    secret: process.env.SESSION_SECRET || "wordlesecret",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/wordle",
      ttl: 14 * 24 * 60 * 60, // 14 days
    }),
    cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 }, // 14 days
  }),
)


app.get("/api/game/new", async (req, res) => {
  try {
   
    const wordList = require("./wordList")
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)].toUpperCase()

    
    const game = new Game({
      word: randomWord,
      userId: req.session.userId || null,
    })

    await game.save()

    res.json({
      gameId: game._id,
      wordLength: randomWord.length,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

app.post("/api/game/:id/guess", async (req, res) => {
  try {
    const { guess } = req.body
    const gameId = req.params.id

    const game = await Game.findById(gameId)
    if (!game) {
      return res.status(404).json({ error: "Game not found" })
    }

    if (game.completed) {
      return res.status(400).json({ error: "Game already completed" })
    }

    
    const wordList = require("./wordList")
    const guessList = require("./guessList")
    const validWords = [...wordList, ...guessList]

    if (!validWords.includes(guess.toLowerCase())) {
      return res.status(400).json({ error: "Not in word list" })
    }

    
    const word = game.word
    const result = []
    const letterCount = {}

   
    for (let i = 0; i < word.length; i++) {
      const letter = word[i]
      letterCount[letter] = (letterCount[letter] || 0) + 1
    }

    
    const tempResult = guess.split("").map((letter, i) => {
      if (letter === word[i]) {
        letterCount[letter]--
        return { letter, status: "correct" }
      }
      return { letter, status: null }
    })

    
    tempResult.forEach((item) => {
      if (item.status === null) {
        if (letterCount[item.letter] > 0) {
          item.status = "present"
          letterCount[item.letter]--
        } else {
          item.status = "absent"
        }
      }
    })

    
    game.guesses.push({
      word: guess,
      result: tempResult,
    })

    
    const isCorrect = guess === word
    if (isCorrect || game.guesses.length >= 6) {
      game.completed = true
      game.won = isCorrect

     
      if (req.session.userId) {
        const user = await User.findById(req.session.userId)
        if (user) {
          user.gamesPlayed += 1
          if (isCorrect) {
            user.gamesWon += 1
            user.currentStreak += 1
            user.maxStreak = Math.max(user.maxStreak, user.currentStreak)
          } else {
            user.currentStreak = 0
          }
          await user.save()
        }
      }
    }

    await game.save()

    res.json({
      result: tempResult,
      completed: game.completed,
      won: game.won,
      word: game.completed ? word : null,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

app.get("/api/stats", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({
        gamesPlayed: 0,
        gamesWon: 0,
        winPercentage: 0,
        currentStreak: 0,
        maxStreak: 0,
      })
    }

    const user = await User.findById(req.session.userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      winPercentage: user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0,
      currentStreak: user.currentStreak,
      maxStreak: user.maxStreak,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})


app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" })
    }

    
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" })
    }

    
    const user = new User({ username, password })
    await user.save()

   
    req.session.userId = user._id

    res.json({ success: true, username })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})


app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" })
    }

   
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid password" })
    }

    
    req.session.userId = user._id

    res.json({ success: true, username })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})


app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" })
    }
    res.json({ success: true })
  })
})


app.get("/api/user", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ loggedIn: false })
    }

    const user = await User.findById(req.session.userId)
    if (!user) {
      return res.json({ loggedIn: false })
    }

    res.json({
      loggedIn: true,
      username: user.username,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
