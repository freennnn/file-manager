import { createReadStream, createWriteStream } from "fs";
import { createBrotliCompress, createBrotliDecompress } from "zlib";
import * as fsExtra from "../fsExtra.js";
import ERRORS from "../errors.js"; 

export async function compress(from, to) {
  let fileExistsAtPath = false;
  fileExistsAtPath = await fsExtra.isPathToValidFile(from);
  if (fileExistsAtPath) {
    await new Promise((resolve, reject) => {
      createReadStream(from)
      .pipe(createBrotliCompress())
      .pipe(createWriteStream(to))
      .on("finish", () => resolve())
      .on("error", (err) => reject(err));
    });
  } else {
    throw new Error(ERRORS.invalidInput);
  }
  //console.log("compressing depressing");
}

export async function decompress(from, to) {
  let fileExistsAtPath = false;
  fileExistsAtPath = await fsExtra.isPathToValidFile(from);
  if (fileExistsAtPath) {
    await new Promise((resolve, reject) => {
      createReadStream(from)
      .pipe(createBrotliDecompress())
      .pipe(createWriteStream(to))
      .on("finish", () => resolve())
      .on("error", (err) => reject(err));
    });
  } else {
    throw new Error(ERRORS.invalidInput);
  }
}