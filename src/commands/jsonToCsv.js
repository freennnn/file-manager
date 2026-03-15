import { createReadStream, createWriteStream } from "node:fs";
import { StringDecoder } from "node:string_decoder";

function operationFailed() {
  const err = new Error("Operation failed");
  err.code = "OPERATION_FAILED";
  return err;
}

function toCsvField(value) {
  let s;
  if (value === null || value === undefined) {
    s = "";
  } else if (typeof value === "object") {
    s = JSON.stringify(value);
  } else {
    s = String(value);
  }

  if (/[,"\r\n]/.test(s)) {
    s = `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

async function readJsonViaStream(absoluteInputPath) {
  const decoder = new StringDecoder("utf8");
  let text = "";

  await new Promise((resolve, reject) => {
    const rs = createReadStream(absoluteInputPath);
    rs.on("data", (chunk) => {
      text += decoder.write(chunk);
    });
    rs.on("end", () => {
      text += decoder.end();
      resolve();
    });
    rs.on("error", () => reject(operationFailed()));
  });

  return text;
}

export async function jsonToCsv({ absoluteInputPath, absoluteOutputPath }) {
  let arr;
  try {
    const jsonText = await readJsonViaStream(absoluteInputPath);
    arr = JSON.parse(jsonText);
  } catch (err) {
    if (err?.code === "OPERATION_FAILED") throw err;
    throw operationFailed();
  }

  if (!Array.isArray(arr)) throw operationFailed();
  if (arr.length === 0) {
    // No headers possible; produce an empty output file.
    try {
      const ws = createWriteStream(absoluteOutputPath);
      await new Promise((resolve, reject) => {
        ws.on("finish", resolve);
        ws.on("error", () => reject(operationFailed()));
        ws.end("");
      });
      return;
    } catch {
      throw operationFailed();
    }
  }

  const first = arr[0];
  if (typeof first !== "object" || first === null || Array.isArray(first)) {
    throw operationFailed();
  }

  const headers = Object.keys(first);

  const ws = createWriteStream(absoluteOutputPath);
  try {
    ws.write(`${headers.map(toCsvField).join(",")}\n`);

    for (const row of arr) {
      if (typeof row !== "object" || row === null || Array.isArray(row)) {
        throw operationFailed();
      }
      const line = headers.map((h) => toCsvField(row[h])).join(",");
      ws.write(`${line}\n`);
    }

    await new Promise((resolve, reject) => {
      ws.on("finish", resolve);
      ws.on("error", () => reject(operationFailed()));
      ws.end();
    });
  } catch (err) {
    ws.destroy();
    if (err?.code === "OPERATION_FAILED") throw err;
    throw operationFailed();
  }
}

