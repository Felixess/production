import express from 'express'
import session from 'express-session'
import logger from 'morgan'
import { createServer } from 'http'
import { setupWebSocket } from './websocket.mjs' // Assuming you have abstracted the WS setup
import { router } from '../routes/routes.mjs' // Assuming you have a separate routes file

const PORT = process.env.PORT || 5001
const SESSION_SECRET = process.env.SESSION_SECRET || 'default_secret'

const app = express()

app.set('view engine', 'ejs')
app.set('views', './views')

// Recommended for production: use a persistent session store
const sessionOptions = {
  cookie: {
    maxAge: 60000
  },
  resave: false,
  saveUninitialized: true,
  secret: SESSION_SECRET
}
app.use(session(sessionOptions))

app.use(logger('dev'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static('public'))

// Define routes in a separate module for better modularity
app.use('/', router)

// Abstracted WebSocket server setup
const server = createServer(app)
setupWebSocket(server)

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})

export default app
