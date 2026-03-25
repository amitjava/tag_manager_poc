import { app } from './app'
import { runMigrations } from './db/database'

const PORT = process.env.PORT || 3000

async function start() {
  await runMigrations()
  app.listen(PORT, () => {
    console.log(`Tag Manager API running on http://localhost:${PORT}`)
  })
}

start()
