import fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "node:stream/promises";
import * as fsExtra from "../fsExtra.js";
import ERRORS from "../errors.js";

export async function add(newFilePath) {
  await fs.writeFile(newFilePath, "");
}

export async function rn(oldPath, newPath) {
  let fileExistsAtOldPath = false;
  fileExistsAtOldPath = await fsExtra.isPathToValidFile(oldPath);
  if (fileExistsAtOldPath) {
    try {
      await fs.rename(oldPath, newPath);
    } catch {
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
      const readable = mvcreateReadStream(oldPath);
      const writeable = createWriteStream(newPath);
      await pipeline(readable, writeable);
    } catch {
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
    }
    catch {
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