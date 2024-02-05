import fs from "fs/promises";
import { createReadStream, createWriteStream, read } from "fs";
import { pipeline } from "node:stream/promises";
import * as fsExtra from "../fsExtra.js";
import ERRORS from "../errors.js";
import { resolve } from "path";
import { rejects } from "assert";

async function copyFile(oldPath, newPath) {
  let fileExistsAtOldPath = false;
  fileExistsAtOldPath = await fsExtra.isPathToValidFile(oldPath);
  if (fileExistsAtOldPath) {
    try {
      const readable = createReadStream(oldPath);
      const writeable = createWriteStream(newPath);
      await pipeline(readable, writeable);
    } catch {
      throw new Error(ERRORS.operationFailed);
    }
  } else {
    throw new Error(ERRORS.invalidInput);
  }
}

async function removeFile(path) {
  let fileExistsAtPath = false;
  fileExistsAtPath = await fsExtra.isPathToValidFile(path);
  if (fileExistsAtPath) {
    try {
      await fs.rm(path);
    }
    catch {
      throw new Error(ERRORS.operationFailed);
    }
  } else {
    throw new Error(ERRORS.invalidInput);
  }
}

export async function cat(path) {
  let fileExistsAtPath = false;
  fileExistsAtPath = await fsExtra.isPathToValidFile(path);
  if (fileExistsAtPath) {
    try {
      const readable = createReadStream(path);

      // For some stupid reason piplene() after successfully writing to stdout emits an error!
      // await pipeline(readable, process.stdout, (err) => {console.log(err);});

      readable.pipe(process.stdout);
      await new Promise((resolve, rejects) => {
        readable.on("end", () => resolve());
        readable.on("error", () => reject());
      });
    }
    catch {
      throw new Error(ERRORS.operationFailed);
    }
  }
  else {
      throw new Error(ERRORS.invalidInput);
  }
}