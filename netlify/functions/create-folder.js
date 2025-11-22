// netlify/functions/create-folder.js
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 }

  try {
    const { path } = JSON.parse(event.body)
    const fullPath = join(process.cwd(), 'public', path)

    await mkdir(fullPath, { recursive: true })
    await writeFile(join(fullPath, '.gitkeep'), '')   // keeps folder alive on Netlify

    return { statusCode: 200, body: 'ok' }
  } catch (err) {
    return { statusCode: 500, body: err.message }
  }
}
