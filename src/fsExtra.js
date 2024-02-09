import * as pathModule from "path";
import fs from "fs/promises";
import ERRORS from "./errors.js";

export async function isPathToValidFile(path) {
  try {
    return (await fs.stat(path)).isFile();
  }
  catch {
    throw new Error(ERRORS.invalidInput)
  }
}

export async function isPathToValidDir(path) {
  try {
    return (await fs.stat(path)).isDirectory();
  }
  catch {
    throw new Error(ERRORS.invalidInput)
  }
}