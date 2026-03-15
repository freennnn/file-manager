import fsp from 'node:fs/promises'
import path from 'node:path'

function operationFailed() {
  const err = new Error('Operation failed')
  err.code = 'OPERATION_FAILED'
  return err
}

export async function up(currentDir) {
  const root = path.parse(currentDir).root
  if (currentDir === root) return currentDir
  return path.dirname(currentDir)
}

export async function cd(targetDirAbsolutePath) {
  try {
    const stat = await fsp.stat(targetDirAbsolutePath)
    if (!stat.isDirectory()) throw new Error('not a dir')
    return targetDirAbsolutePath
  } catch {
    throw operationFailed()
  }
}

export async function ls(currentDir) {
  let entries
  try {
    entries = await fsp.readdir(currentDir, { withFileTypes: true })
  } catch {
    throw operationFailed()
  }

  const dirs = []
  const files = []

  for (const ent of entries) {
    if (ent.isDirectory()) dirs.push(ent.name)
    else if (ent.isFile()) files.push(ent.name)
  }

  const sort = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })
  dirs.sort(sort)
  files.sort(sort)

  const allNames = dirs.concat(files)
  let maxLen = 0
  for (const n of allNames) {
    if (n.length > maxLen) maxLen = n.length
  }
  const padWidth = allNames.length ? maxLen + 2 : 0

  for (const name of dirs) {
    const left = padWidth ? name.padEnd(padWidth) : name
    console.log(`${left}[folder]`)
  }
  for (const name of files) {
    const left = padWidth ? name.padEnd(padWidth) : name
    console.log(`${left}[file]`)
  }
}
