import fs from "fs/promises";
import * as fsExtra from "../fsExtra.js";
import ERRORS from "../errors.js";
import path from "path";
 
export async function cd(pathToDir) {
  let dirExistsAtPath = false;
  dirExistsAtPath = await fsExtra.isPathToValidDir(pathToDir);
  if (dirExistsAtPath) {
    return pathToDir;
  } else {
    throw new Error(ERRORS.invalidInput);
  }
}

export async function ls(pathToDir) {
  try {
    let elements = await fs.readdir(pathToDir, { withFileTypes: true });
    let directories = elements.filter(el => el.isDirectory());
    let otherElements = elements.filter(el => !el.isDirectory());
    const dirStrings = directories.sort().map(el => { return { Name: el.name, Type: "Directory"}});
    const fileStrings = otherElements.sort().map(el => { return { Name: el.name, Type: "File"}});
    console.table(dirStrings.concat(fileStrings));

  } catch {
    throw new Error(ERRORS.operationFailed);
  }
}