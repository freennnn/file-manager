import crypto from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'

function operationFailed() {
  const err = new Error('Operation failed')
  err.code = 'OPERATION_FAILED'
  return err
}

async function deriveKey(password, salt) {
  return await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 32, (err, derivedKey) => {
      if (err) return reject(operationFailed())
      resolve(derivedKey)
    })
  })
}

export async function encryptFile({
  absoluteInputPath,
  absoluteOutputPath,
  password,
}) {
  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(12)

  let key
  try {
    key = await deriveKey(password, salt)
  } catch (err) {
    if (err?.code === 'OPERATION_FAILED') throw err
    throw operationFailed()
  }

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ws = createWriteStream(absoluteOutputPath)

  try {
    // Header: salt + iv
    ws.write(salt)
    ws.write(iv)

    // Stream ciphertext, keep ws open to append authTag later
    await pipeline(createReadStream(absoluteInputPath), cipher, ws, {
      end: false,
    })

    const authTag = cipher.getAuthTag()
    ws.write(authTag)

    await new Promise((resolve, reject) => {
      ws.on('finish', resolve)
      ws.on('error', () => reject(operationFailed()))
      ws.end()
    })
  } catch (err) {
    ws.destroy()
    if (err?.code === 'OPERATION_FAILED') throw err
    throw operationFailed()
  }
}
