import express from 'express'
import cors from 'cors'
import advertisersRouter from './routes/advertisers'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/advertisers', advertisersRouter)

export { app }
