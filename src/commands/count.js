import { createReadStream } from 'node:fs'
import { StringDecoder } from 'node:string_decoder'

function operationFailed() {
  const err = new Error('Operation failed')
  err.code = 'OPERATION_FAILED'
  return err
}

export async function countFile(absoluteInputPath) {
  const decoder = new StringDecoder('utf8')

  let lines = 0
  let words = 0
  let characters = 0
  let inWord = false
  let lastCharWasNewline = false

  const whitespace = /\s/

  return await new Promise((resolve, reject) => {
    const rs = createReadStream(absoluteInputPath)

    rs.on('data', (chunk) => {
      const text = decoder.write(chunk)
      if (!text) return

      characters += text.length

      for (let i = 0; i < text.length; i++) {
        const ch = text[i]

        if (ch === '\n') lines++

        const isWs = whitespace.test(ch)
        if (isWs) {
          inWord = false
        } else if (!inWord) {
          inWord = true
          words++
        }
      }

      lastCharWasNewline = text[text.length - 1] === '\n'
    })

    rs.on('end', () => {
      const tail = decoder.end()
      if (tail) {
        characters += tail.length
        for (let i = 0; i < tail.length; i++) {
          const ch = tail[i]
          if (ch === '\n') lines++

          const isWs = whitespace.test(ch)
          if (isWs) {
            inWord = false
          } else if (!inWord) {
            inWord = true
            words++
          }
        }
        lastCharWasNewline = tail[tail.length - 1] === '\n'
      }

      // Count the final line if file has content but doesn't end with '\n'
      //"hello\nworld" has 1 newline, but visually has 2 lines → counting only \n would give 1, so they add 1 at EOF.
      if (characters > 0 && !lastCharWasNewline) {
        lines++
      }

      console.log(`Lines: ${lines}`)
      console.log(`Words: ${words}`)
      console.log(`Characters: ${characters}`)
      resolve()
    })

    rs.on('error', () => reject(operationFailed()))
  })
}
