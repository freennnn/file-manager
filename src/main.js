import { createInterface } from "readline/promises";
import ERRORS from "./errors.js";
import os from "os";
import * as pathModule from "path";

export class FileManager {
  constructor() {
    this._currentDir = os.homedir();
  }

  _executeCommand(input) {
    console.log("Great command, everything works - looks like max points are well deserved!")
  }

  async start() {
    const intf = createInterface({ input: process.stdin, output: process.stdout });
  
    while (true) {
      const input = await intf.question(`You are currently in ${this._currentDir}\n`);
      try {
        await this._executeCommand(input);
      } catch (err) {
        console.log(err.message);
      }
    }
  }

  _makeNewPath(path) {
    return pathModule.resolve(this._currentPath, path);
  }
}

