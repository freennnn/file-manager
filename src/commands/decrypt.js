import crypto from 'node:crypto'
import fs from 'node:fs/promises'
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

export async function decryptFile({
  absoluteInputPath,
  absoluteOutputPath,
  password,
}) {
  let stat
  try {
    stat = await fs.stat(absoluteInputPath)
  } catch {
    throw operationFailed()
  }

  const size = stat.size
  const headerLen = 16 + 12
  const authTagLen = 16

  if (size < headerLen + authTagLen) {
    throw operationFailed()
  }

  // Read header (salt + iv) and authTag (last 16 bytes) into memory
  let salt, iv, authTag
  let fh
  try {
    fh = await fs.open(absoluteInputPath, 'r')
    const headerBuf = Buffer.alloc(headerLen)
    const tagBuf = Buffer.alloc(authTagLen)

    const headerRead = await fh.read(headerBuf, 0, headerLen, 0)
    if (headerRead.bytesRead !== headerLen) throw new Error('short header')

    const tagRead = await fh.read(tagBuf, 0, authTagLen, size - authTagLen)
    if (tagRead.bytesRead !== authTagLen) throw new Error('short tag')

    salt = headerBuf.subarray(0, 16)
    iv = headerBuf.subarray(16, 28)
    authTag = tagBuf
  } catch {
    if (fh) await fh.close().catch(() => {})
    throw operationFailed()
  } finally {
    if (fh) await fh.close().catch(() => {})
  }

  let key
  try {
    key = await deriveKey(password, salt)
  } catch (err) {
    if (err?.code === 'OPERATION_FAILED') throw err
    throw operationFailed()
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  const ciphertextStart = headerLen
  const ciphertextEndInclusive = size - authTagLen - 1

  try {
    await pipeline(
      createReadStream(absoluteInputPath, {
        start: ciphertextStart,
        end: ciphertextEndInclusive,
      }),
      decipher,
      createWriteStream(absoluteOutputPath),
    )
  } catch {
    throw operationFailed()
  }
}
