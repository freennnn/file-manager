import fs from "node:fs/promises";
import crypto from "node:crypto";
import { createReadStream } from "node:fs";

const SUPPORTED = new Set(["sha256", "md5", "sha512"]);

function operationFailed() {
  const err = new Error("Operation failed");
  err.code = "OPERATION_FAILED";
  return err;
}

async function computeHash(absoluteInputPath, algorithm) {
  const hash = crypto.createHash(algorithm);
  return await new Promise((resolve, reject) => {
    const rs = createReadStream(absoluteInputPath);
    rs.on("data", (chunk) => hash.update(chunk));
    rs.on("end", () => resolve(hash.digest("hex")));
    rs.on("error", () => reject(operationFailed()));
  });
}

export async function hashCompare({
  absoluteInputPath,
  absoluteHashPath,
  algorithm = "sha256",
}) {
  if (!SUPPORTED.has(algorithm)) throw operationFailed();

  let expected;
  try {
    expected = await fs.readFile(absoluteHashPath, "utf8");
  } catch {
    throw operationFailed();
  }

  expected = expected.trimEnd().toLowerCase();
  const actual = (await computeHash(absoluteInputPath, algorithm)).toLowerCase();

  console.log(actual === expected ? "OK" : "MISMATCH");
}

