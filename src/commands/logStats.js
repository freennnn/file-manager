import os from 'node:os'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Worker } from 'node:worker_threads'

function operationFailed() {
  const err = new Error('Operation failed')
  err.code = 'OPERATION_FAILED'
  return err
}

function addCounts(target, src) {
  for (const [k, v] of Object.entries(src)) {
    target[k] = (target[k] ?? 0) + v
  }
}

function mergePathCounts(map, obj) {
  for (const [p, c] of Object.entries(obj)) {
    map.set(p, (map.get(p) ?? 0) + c)
  }
}

async function findNextNewline(fd, fromPos, fileSize) {
  const bufSize = 64 * 1024
  const buf = Buffer.allocUnsafe(bufSize)
  let pos = fromPos

  while (pos < fileSize) {
    const toRead = Math.min(bufSize, fileSize - pos)
    const { bytesRead } = await fd.read(buf, 0, toRead, pos)
    if (bytesRead <= 0) break

    const idx = buf.subarray(0, bytesRead).indexOf(10) // '\n'
    if (idx !== -1) return pos + idx
    pos += bytesRead
  }

  return fileSize - 1
}

function runWorker(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/logWorker.js', import.meta.url),
      {
        workerData,
      },
    )

    worker.once('message', (msg) => {
      worker.terminate().catch(() => {})
      if (msg?.ok) resolve(msg.stats)
      else reject(operationFailed())
    })
    worker.once('error', () => reject(operationFailed()))
    worker.once('exit', (code) => {
      if (code !== 0) reject(operationFailed())
    })
  })
}

export async function logStats({ absoluteInputPath, absoluteOutputPath }) {
  let stat
  try {
    stat = await fs.stat(absoluteInputPath)
  } catch {
    throw operationFailed()
  }

  const fileSize = stat.size
  const cpuCount = os.cpus().length || 1

  if (fileSize === 0) {
    const empty = {
      total: 0,
      levels: {},
      status: {},
      topPaths: [],
      avgResponseTimeMs: 0,
    }
    try {
      await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true })
      await fs.writeFile(absoluteOutputPath, JSON.stringify(empty, null, 2))
      return
    } catch {
      throw operationFailed()
    }
  }

  const fh = await fs.open(absoluteInputPath, 'r').catch(() => null)
  if (!fh) throw operationFailed()

  const chunks = []
  try {
    const approx = Math.ceil(fileSize / cpuCount)
    let start = 0

    for (let i = 0; i < cpuCount; i++) {
      if (start >= fileSize) {
        chunks.push({ start: -1, end: -1 })
        continue
      }

      const desiredEnd = Math.min(fileSize - 1, start + approx - 1)
      const end =
        i === cpuCount - 1
          ? fileSize - 1
          : await findNextNewline(fh, desiredEnd, fileSize)
      chunks.push({ start, end })
      start = end + 1
    }
  } catch {
    await fh.close().catch(() => {})
    throw operationFailed()
  } finally {
    await fh.close().catch(() => {})
  }

  const partials = await Promise.all(
    chunks.map(({ start, end }) =>
      runWorker({
        filePath: absoluteInputPath,
        start,
        end,
      }),
    ),
  ).catch(() => {
    throw operationFailed()
  })

  const merged = {
    total: 0,
    levels: {},
    status: {},
    responseTimeSum: 0,
  }
  const pathMap = new Map()

  for (const p of partials) {
    merged.total += p.total
    merged.responseTimeSum += p.responseTimeSum
    addCounts(merged.levels, p.levels)
    addCounts(merged.status, p.status)
    mergePathCounts(pathMap, p.paths)
  }

  const topPaths = Array.from(pathMap.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([p, count]) => ({ path: p, count }))

  const avg = merged.total ? merged.responseTimeSum / merged.total : 0
  const out = {
    total: merged.total,
    levels: merged.levels,
    status: merged.status,
    topPaths,
    avgResponseTimeMs: Number.parseFloat(avg.toFixed(2)),
  }

  try {
    await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true })
    await fs.writeFile(absoluteOutputPath, JSON.stringify(out, null, 2))
  } catch {
    throw operationFailed()
  }
}
