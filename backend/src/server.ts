import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createApp } from './app.js'
import { openDatabase } from './database.js'

const port = Number(process.env.PORT ?? 3001)
const databasePath = resolve(process.env.VERIMOD_DB_PATH ?? './data/verimod.sqlite')
mkdirSync(dirname(databasePath), { recursive: true })
const database = openDatabase(databasePath)

createApp({ database }).listen(port, () => {
  console.log(`verimod-backend listening on http://localhost:${port}`)
})
