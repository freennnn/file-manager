import { createReadStream, createWriteStream } from "fs";
import { createBrotliCompress, createBrotliDecompress } from "zlib";
import * as fsExtra from "../fsExtra.js";
import ERRORS from "../errors.js";

export async function compress(from, to) {
  let fileExistsAtPath = false;
  fileExistsAtPath = await fsExtra.isPathToValidFile(from);
  if (fileExistsAtPath) {
    await new Promise((resolve, reject) => {
      const readStream = createReadStream(from);
      const compressStream = createBrotliCompress();
      const writeStream = createWriteStream(to);

      // Handle errors on all streams in the pipeline
      readStream.on("error", (err) => reject(err));
      compressStream.on("error", (err) => reject(err));
      writeStream.on("error", (err) => reject(err));

      readStream
        .pipe(compressStream)
        .pipe(writeStream)
        .on("finish", () => resolve());
    });
  } else {
    throw new Error(ERRORS.invalidInput);
  }
}

export async function decompress(from, to) {
  let fileExistsAtPath = false;
  fileExistsAtPath = await fsExtra.isPathToValidFile(from);
  if (fileExistsAtPath) {
    await new Promise((resolve, reject) => {
      const readStream = createReadStream(from);
      const decompressStream = createBrotliDecompress();
      const writeStream = createWriteStream(to);

      // Handle errors on all streams in the pipeline
      readStream.on("error", (err) => reject(err));
      decompressStream.on("error", (err) => reject(err));
      writeStream.on("error", (err) => reject(err));

      readStream
        .pipe(decompressStream)
        .pipe(writeStream)
        .on("finish", () => resolve());
    });
  } else {
    throw new Error(ERRORS.invalidInput);
  }
}