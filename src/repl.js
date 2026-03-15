import os from 'node:os'
import { createInterface } from 'node:readline/promises'
import { resolvePath } from './utils/pathResolver.js'
import * as navigation from './navigation.js'
import { countFile } from './commands/count.js'
import { parseFlags } from './utils/argParser.js'
import { hashFile } from './commands/hash.js'
import { hashCompare } from './commands/hashCompare.js'
import { csvToJson } from './commands/csvToJson.js'
import { jsonToCsv } from './commands/jsonToCsv.js'

const INVALID_INPUT = 'Invalid input'
const OPERATION_FAILED = 'Operation failed'
const WELCOME = 'Welcome to Data Processing CLI!'
const GOODBYE = 'Thank you for using Data Processing CLI!'

function parseInput(input) {
  // "", then '', then bare token
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g
  const parts = []
  let match

  while ((match = regex.exec(input)) !== null) {
    parts.push(match[1] || match[2] || match[0])
  }

  return parts
}

function printCwd(currentDir) {
  console.log(`You are currently in ${currentDir}`)
}

function normalizeError(err) {
  if (err?.code === 'INVALID_INPUT' || err?.message === INVALID_INPUT) {
    return INVALID_INPUT
  }
  if (err?.code === 'OPERATION_FAILED' || err?.message === OPERATION_FAILED) {
    return OPERATION_FAILED
  }
  return OPERATION_FAILED
}

async function defaultDispatch() {
  const err = new Error(INVALID_INPUT)
  err.code = 'INVALID_INPUT'
  throw err
}

function invalidInput() {
  const err = new Error(INVALID_INPUT)
  err.code = 'INVALID_INPUT'
  return err
}

async function builtInDispatch({ command, args, currentDir }) {
  if (command === 'up') {
    const next = await navigation.up(currentDir)
    return { currentDir: next }
  }

  if (command === 'cd') {
    if (!args?.length) throw invalidInput()
    const target = resolvePath(currentDir, args[0])
    if (!target) throw invalidInput()
    const next = await navigation.cd(target)
    return { currentDir: next }
  }

  if (command === 'ls') {
    await navigation.ls(currentDir)
    return { currentDir }
  }

  if (command === 'count') {
    const flags = parseFlags(args ?? [])
    if (!flags.input) throw invalidInput()
    const inputPath = resolvePath(currentDir, flags.input)
    if (!inputPath) throw invalidInput()
    await countFile(inputPath)
    return { currentDir }
  }

  if (command === 'hash') {
    const flags = parseFlags(args ?? [])
    if (!flags.input) throw invalidInput()
    const inputPath = resolvePath(currentDir, flags.input)
    if (!inputPath) throw invalidInput()
    await hashFile({
      absoluteInputPath: inputPath,
      algorithm: flags.algorithm ?? 'sha256',
      save: Boolean(flags.save),
    })
    return { currentDir }
  }

  if (command === 'hash-compare') {
    const flags = parseFlags(args ?? [])
    if (!flags.input || !flags.hash) throw invalidInput()
    const inputPath = resolvePath(currentDir, flags.input)
    const hashPath = resolvePath(currentDir, flags.hash)
    if (!inputPath || !hashPath) throw invalidInput()
    await hashCompare({
      absoluteInputPath: inputPath,
      absoluteHashPath: hashPath,
      algorithm: flags.algorithm ?? 'sha256',
    })
    return { currentDir }
  }

  if (command === 'csv-to-json') {
    const flags = parseFlags(args ?? [])
    if (!flags.input || !flags.output) throw invalidInput()
    const inputPath = resolvePath(currentDir, flags.input)
    const outputPath = resolvePath(currentDir, flags.output)
    if (!inputPath || !outputPath) throw invalidInput()
    await csvToJson({
      absoluteInputPath: inputPath,
      absoluteOutputPath: outputPath,
    })
    return { currentDir }
  }

  if (command === 'json-to-csv') {
    const flags = parseFlags(args ?? [])
    if (!flags.input || !flags.output) throw invalidInput()
    const inputPath = resolvePath(currentDir, flags.input)
    const outputPath = resolvePath(currentDir, flags.output)
    if (!inputPath || !outputPath) throw invalidInput()
    await jsonToCsv({
      absoluteInputPath: inputPath,
      absoluteOutputPath: outputPath,
    })
    return { currentDir }
  }

  return await defaultDispatch()
}

export async function startRepl({
  initialDir = os.homedir(),
  dispatch = builtInDispatch,
} = {}) {
  console.log(WELCOME)
  let currentDir = initialDir
  printCwd(currentDir)
  const rl = createInterface({ input: process.stdin, output: process.stdout })

  const onSigint = () => {
    rl.close()
  }

  process.once('SIGINT', onSigint)

  try {
    while (true) {
      let line
      try {
        line = await rl.question('>')
      } catch {
        break
      }

      const trimmed = String(line ?? '').trim()
      if (!trimmed) continue

      if (trimmed === '.exit') {
        break
      }

      const [command, ...args] = parseInput(trimmed)

      try {
        const result = await dispatch({ command, args, currentDir })
        if (result?.currentDir) currentDir = result.currentDir
        printCwd(currentDir)
      } catch (err) {
        console.log(normalizeError(err))
      }
    }
  } finally {
    process.removeListener('SIGINT', onSigint)
    rl.close()
    console.log(GOODBYE)
  }
}
