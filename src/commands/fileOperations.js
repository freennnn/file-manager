import fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "node:stream/promises";
import * as fsExtra from "../fsExtra.js";
import ERRORS from "../errors.js";

export async function add(newFilePath) {
  try {
    await fs.writeFile(newFilePath, "", { flag: "wx+" });
  } catch (err) {
    throw new Error(ERRORS.operationFailed);
  }
}

export async function rn(oldPath, newPath) {
  let fileExistsAtOldPath = false;
  fileExistsAtOldPath = await fsExtra.isPathToValidFile(oldPath);
  if (fileExistsAtOldPath) {
    try {
      await fs.rename(oldPath, newPath);
    } catch (err) {
      throw new Error(ERRORS.operationFailed);
    }
  } else {
    throw new Error(ERRORS.invalidInput);
  }
}

export async function cp(oldPath, newPath) {
  let fileExistsAtOldPath = false;
  fileExistsAtOldPath = await fsExtra.isPathToValidFile(oldPath);
  if (fileExistsAtOldPath) {
    try {
      const readable = createReadStream(oldPath);
      const writeable = createWriteStream(newPath);
      await pipeline(readable, writeable);
    } catch (err) {
      throw new Error(ERRORS.operationFailed);
    }
  } else {
    throw new Error(ERRORS.invalidInput);
  }
}

export async function rm(path) {
  let fileExistsAtPath = false;
  fileExistsAtPath = await fsExtra.isPathToValidFile(path);
  if (fileExistsAtPath) {
    try {
      await fs.rm(path);
    } catch (err) {
      throw new Error(ERRORS.operationFailed);
    }
  } else {
    throw new Error(ERRORS.invalidInput);
  }
}

export async function mv(oldPath, newPath) {
  await cp(oldPath, newPath);
  await rm(oldPath);
}

export async function cat(path) {
  let fileExistsAtPath = false;
  fileExistsAtPath = await fsExtra.isPathToValidFile(path);
  if (fileExistsAtPath) {
    try {
      const readable = createReadStream(path);

      // For some stupid reason pipelene() after successfully writing to stdout emits an error!
      // await pipeline(readable, process.stdout, (err) => {console.log(err);});
      // 2025 update: pipeline() has {end: false} option now, not closing stdout - and hence avoiding error

      readable.pipe(process.stdout);
      await new Promise((resolve, reject) => {
        readable.on("end", () => {
          process.stdout.write('\n'); // Add newline after file content
          resolve();
        });
        readable.on("error", (err) => reject(err));
      });
    } catch (err) {
      throw new Error(ERRORS.operationFailed);
    }
  }
  else {
    throw new Error(ERRORS.invalidInput);
  }
}