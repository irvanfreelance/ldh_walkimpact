import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
const sql = neon(connectionString)

export default sql
