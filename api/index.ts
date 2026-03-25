import { app } from '../backend/src/app'
import { runMigrations } from '../backend/src/db/database'

const ready = runMigrations()

export default async function handler(req: any, res: any) {
  await ready
  app(req, res)
}
