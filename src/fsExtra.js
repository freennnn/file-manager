import fs from "fs/promises";

export async function isPathToValidFile(path) {
  try {
    return (await fs.stat(path)).isFile();
  }
  catch {
    return false; // File doesn't exist or path is invalid
  }
}

export async function isPathToValidDir(path) {
  try {
    return (await fs.stat(path)).isDirectory();
  }
  catch {
    return false; // Directory doesn't exist or path is invalid
  }
}