import { parentPort, workerData } from 'node:worker_threads'
import { createReadStream } from 'node:fs'
import { StringDecoder } from 'node:string_decoder'

function addCount(obj, key, inc = 1) {
  obj[key] = (obj[key] ?? 0) + inc
}

function statusClass(code) {
  const n = Number.parseInt(code, 10)
  if (!Number.isFinite(n)) return null
  const c = Math.floor(n / 100)
  return `${c}xx`
}

async function processChunk({ filePath, start, end }) {
  const result = {
    total: 0,
    levels: {},
    status: {},
    paths: {},
    responseTimeSum: 0,
  }

  if (start < 0 || end < 0 || end < start) {
    return result
  }

  const decoder = new StringDecoder('utf8')
  let leftover = ''

  await new Promise((resolve, reject) => {
    const rs = createReadStream(filePath, { start, end })

    rs.on('data', (chunk) => {
      const text = leftover + decoder.write(chunk)
      const lines = text.split('\n')
      leftover = lines.pop() ?? ''

      for (const raw of lines) {
        const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw
        if (!line) continue

        const parts = line.split(' ')
        if (parts.length < 7) continue

        const level = parts[1]
        const statusCode = parts[3]
        const responseTime = parts[4]
        const path = parts[6]

        result.total++
        addCount(result.levels, level)

        const cls = statusClass(statusCode)
        if (cls) addCount(result.status, cls)

        addCount(result.paths, path)

        const rt = Number.parseFloat(responseTime)
        if (Number.isFinite(rt)) result.responseTimeSum += rt
      }
    })

    rs.on('end', () => {
      const tail = leftover + decoder.end()
      const line = tail.endsWith('\r') ? tail.slice(0, -1) : tail
      if (line) {
        const parts = line.split(' ')
        if (parts.length >= 7) {
          const level = parts[1]
          const statusCode = parts[3]
          const responseTime = parts[4]
          const path = parts[6]

          result.total++
          addCount(result.levels, level)

          const cls = statusClass(statusCode)
          if (cls) addCount(result.status, cls)

          addCount(result.paths, path)

          const rt = Number.parseFloat(responseTime)
          if (Number.isFinite(rt)) result.responseTimeSum += rt
        }
      }
      resolve()
    })

    rs.on('error', reject)
  })

  return result
}

try {
  const stats = await processChunk(workerData)
  parentPort.postMessage({ ok: true, stats })
} catch (e) {
  parentPort.postMessage({ ok: false })
}
