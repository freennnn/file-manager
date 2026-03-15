# Data Processing CLI

Interactive **Data Processing Toolkit** (Node.js 24+) that supports navigation, streaming file processing, cryptographic hashing, AES-256-GCM encryption/decryption, and multi-core log analytics via Worker Threads.

## Requirements

- Node.js **v24.10.0+**
- **No external libraries**

## Run

```bash
npm run start
```

On startup it prints:
- `Welcome to Data Processing CLI!`
- `You are currently in <homeDir>`

Commands are entered at the `>` prompt. Exit via `.exit` or `Ctrl+C`.

## Paths and working directory

- The CLI maintains its own **current working directory** (starts at your home directory).
- Relative paths in commands are resolved relative to the current working directory.
- After each successful command, it prints `You are currently in ...` again.

## Commands

### Navigation

- `up`
  - Move up one directory (no-op at filesystem root)

- `cd <path_to_directory>`
  - Change directory (relative or absolute)

- `ls`
  - List directories first, then files, alphabetical
  - Output format:

```
folder1    [folder]
file.txt   [file]
```

### CSV / JSON

- `csv-to-json --input <csvPath> --output <jsonPath>`
  - First line = headers
  - Output = JSON array (streamed)

- `json-to-csv --input <jsonPath> --output <csvPath>`
  - Input must be a JSON array of objects
  - Output headers come from the first object’s keys

### Counting

- `count --input <filePath>`

Output:
```
Lines: <n>
Words: <n>
Characters: <n>
```

### Hashing

- `hash --input <filePath> [--algorithm sha256|md5|sha512] [--save]`
  - Default algorithm: `sha256`
  - `--save` writes `<inputFilename>.<algorithm>` next to the input file

- `hash-compare --input <filePath> --hash <hashFilePath> [--algorithm sha256|md5|sha512]`
  - Prints `OK` or `MISMATCH`

### Encryption (AES-256-GCM)

- `encrypt --input <filePath> --output <encPath> --password <password>`
- `decrypt --input <encPath> --output <filePath> --password <password>`

Encrypted file format (binary):
- first 16 bytes: `salt`
- next 12 bytes: `iv`
- then: `ciphertext`
- last 16 bytes: `authTag`

### Log analytics (Worker Threads)

- `log-stats --input <logsPath> --output <statsJsonPath>`

The tool splits the file into chunks (equal to CPU cores), processes each chunk in a Worker Thread, merges partial stats, and writes JSON like:

```json
{
  "total": 1000,
  "levels": { "INFO": 700, "WARN": 200, "ERROR": 100 },
  "status": { "2xx": 800, "3xx": 50, "4xx": 120, "5xx": 30 },
  "topPaths": [{ "path": "/api/users", "count": 120 }],
  "avgResponseTimeMs": 137.42
}
```

## Test log generator

Generate a large log file:

```bash
node scripts/generate-logs.js --output workspace/logs.txt --lines 500000
```

Note: this repo uses ESM (`"type": "module"`). The generator is CommonJS, so `scripts/package.json` sets `"type": "commonjs"` to keep the command above working unchanged.