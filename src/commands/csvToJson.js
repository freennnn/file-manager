import { createReadStream, createWriteStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { StringDecoder } from "node:string_decoder";

function operationFailed() {
  const err = new Error("Operation failed");
  err.code = "OPERATION_FAILED";
  return err;
}

function parseCsvRow(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }

    if (ch === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
}

class CsvToJsonTransform extends Transform {
  constructor() {
    super();
    this.decoder = new StringDecoder("utf8");
    this.leftover = "";
    this.headers = null;
    this.emittedAny = false;
  }

  _transform(chunk, _enc, cb) {
    try {
      const text = this.leftover + this.decoder.write(chunk);
      const lines = text.split("\n");
      this.leftover = lines.pop() ?? "";

      for (const raw of lines) {
        const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
        if (!line) continue;

        if (!this.headers) {
          this.headers = parseCsvRow(line);
          continue;
        }

        const fields = parseCsvRow(line);
        const obj = {};
        for (let i = 0; i < this.headers.length; i++) {
          obj[this.headers[i]] = fields[i] ?? "";
        }

        if (!this.emittedAny) {
          this.push("[\n");
          this.emittedAny = true;
          this.push(`  ${JSON.stringify(obj)}`);
        } else {
          this.push(`,\n  ${JSON.stringify(obj)}`);
        }
      }

      cb();
    } catch (e) {
      cb(e);
    }
  }

  _flush(cb) {
    try {
      const tail = this.leftover + this.decoder.end();
      const trimmed = tail.endsWith("\r") ? tail.slice(0, -1) : tail;

      if (trimmed) {
        if (!this.headers) {
          this.headers = parseCsvRow(trimmed);
        } else {
          const fields = parseCsvRow(trimmed);
          const obj = {};
          for (let i = 0; i < this.headers.length; i++) {
            obj[this.headers[i]] = fields[i] ?? "";
          }

          if (!this.emittedAny) {
            this.push("[\n");
            this.emittedAny = true;
            this.push(`  ${JSON.stringify(obj)}`);
          } else {
            this.push(`,\n  ${JSON.stringify(obj)}`);
          }
        }
      }

      if (!this.headers) {
        // Empty file: treat as empty array
        this.push("[]\n");
      } else if (!this.emittedAny) {
        // Headers only: empty array
        this.push("[]\n");
      } else {
        this.push("\n]\n");
      }

      cb();
    } catch (e) {
      cb(e);
    }
  }
}

export async function csvToJson({ absoluteInputPath, absoluteOutputPath }) {
  try {
    await pipeline(
      createReadStream(absoluteInputPath),
      new CsvToJsonTransform(),
      createWriteStream(absoluteOutputPath)
    );
  } catch {
    throw operationFailed();
  }
}

