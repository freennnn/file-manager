import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const SUPPORTED = new Set(["sha256", "md5", "sha512"]);

function operationFailed() {
  const err = new Error("Operation failed");
  err.code = "OPERATION_FAILED";
  return err;
}

export async function hashFile({
  absoluteInputPath,
  algorithm = "sha256",
  save = false,
}) {
  if (!SUPPORTED.has(algorithm)) {
    throw operationFailed();
  }

  const hash = crypto.createHash(algorithm);

  const digestHex = await new Promise((resolve, reject) => {
    const rs = createReadStream(absoluteInputPath);

    rs.on("data", (chunk) => hash.update(chunk));
    rs.on("end", () => resolve(hash.digest("hex")));
    rs.on("error", () => reject(operationFailed()));
  });

  console.log(`${algorithm}: ${digestHex}`);

  if (save) {
    const dir = path.dirname(absoluteInputPath);
    const base = path.basename(absoluteInputPath);
    const outPath = path.join(dir, `${base}.${algorithm}`);
    try {
      await fs.writeFile(outPath, `${digestHex}\n`);
    } catch {
      throw operationFailed();
    }
  }
}