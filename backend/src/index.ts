import express from 'express'
import cors from 'cors'
import { runMigrations } from './db/database'
import advertisersRouter from './routes/advertisers'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/advertisers', advertisersRouter)

const PORT = process.env.PORT || 3000

async function start() {
  await runMigrations()
  app.listen(PORT, () => {
    console.log(`Tag Manager API running on http://localhost:${PORT}`)
  })
}

start()

export { app }
