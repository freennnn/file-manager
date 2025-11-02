import crypto from 'crypto';
import { createReadStream } from 'fs';
import * as fsExtra from '../fsExtra.js';
import ERRORS from "../errors.js";

export default async function calculateHash(pathToFile) {
  let fileExistsAtPath = false;
  fileExistsAtPath = await fsExtra.isPathToValidFile(pathToFile);
  if (fileExistsAtPath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const rs = createReadStream(pathToFile);
      rs.on('data', (data) => hash.update(data));
      rs.on('end', () => {
        let hashValue = hash.digest('hex');
        console.log(hashValue);
        resolve(hashValue);
      });
      rs.on('error', (err) => { reject(err) });
    });
  } else {
    throw new Error(ERRORS.invalidInput);
  }


};