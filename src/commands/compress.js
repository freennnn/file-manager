import { createReadStream, createWriteStream } from "fs";
import { createBrotliCompress, createBrotliDecompress } from "zlib";
import * as fsExtra from "../fsExtra.js";
import ERRORS from "../errors.js";
import * as pathModule from "path";

const BROTLI_EXTENSION = ".br";

export async function compress(from, to) {
  const fileExistsAtPath = await fsExtra.isPathToValidFile(from);
  if (fileExistsAtPath) {
    // Check if destination is a directory
    const isDestDir = await fsExtra.isPathToValidDir(to);
    let destinationPath = to;

    if (isDestDir) {
      // If destination is a directory, append the source filename with .br extension
      const sourceFilename = pathModule.basename(from);
      destinationPath = pathModule.resolve(to, `${sourceFilename}${BROTLI_EXTENSION}`);
    }

    await new Promise((resolve, reject) => {
      const readStream = createReadStream(from);
      const compressStream = createBrotliCompress();
      const writeStream = createWriteStream(destinationPath);

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
  const fileExistsAtPath = await fsExtra.isPathToValidFile(from);
  if (!fileExistsAtPath) {
    throw new Error(ERRORS.invalidInput);
  }

  // Validate that the file has .br extension (Brotli compressed)
  const parsedPath = pathModule.parse(from);
  if (parsedPath.ext !== BROTLI_EXTENSION) {
    throw new Error(`${ERRORS.invalidInput}: File must have ${BROTLI_EXTENSION} extension for decompression`);
  }

  // Check if destination is a directory
  const isDestDir = await fsExtra.isPathToValidDir(to);
  let destinationPath = to;

  if (isDestDir) {
    // If destination is a directory, append the source filename (removing .br extension)
    const sourceFilename = parsedPath.name; // filename without .br extension
    destinationPath = pathModule.resolve(to, sourceFilename);
  }

  await new Promise((resolve, reject) => {
    const readStream = createReadStream(from);
    const decompressStream = createBrotliDecompress();
    const writeStream = createWriteStream(destinationPath);

    // Handle errors on all streams in the pipeline
    readStream.on("error", (err) => reject(err));
    decompressStream.on("error", (err) => reject(err));
    writeStream.on("error", (err) => reject(err));

    readStream
      .pipe(decompressStream)
      .pipe(writeStream)
      .on("finish", () => resolve());
  });
}