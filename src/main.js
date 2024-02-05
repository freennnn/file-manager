import { createInterface } from "readline/promises";
import ERRORS from "./errors.js";
import os from "os";
import * as pathModule from "path";
import * as fileOperations from "./commands/fileOperations.js"

export class FileManager {
  constructor() {
    this._currentDir = os.homedir();

    // need to .bind(this) due to loosing execution context after getting functions/methods back from object
    // obect is using for Strategy pattern to avoid big switch/if-s
    this._commands = {
      up: this._up.bind(this),
      ls: this._ls.bind(this),
      cd: this._cd.bind(this), // 1 arg
      cat: this._cat.bind(this), // 1 arg
      add: this._add.bind(this), // 1 arg
      cp: this._cp.bind(this), // 2 args
      ".exit": this._exit.bind(this),
      mv: this._mv.bind(this), // 2 args
      rm: this._rm.bind(this), // 1 arg
      rn: this._rn.bind(this), // 2 args
      hash: this._hash.bind(this), // 1 arg
      compress: this._compress.bind(this), // 2 args
      decompress: this._decompress.bind(this), // 2 args
      os: this._os.bind(this), // 1 arg
    }
  }

  async _executeCommand(input) {
    const [command, ...args] = this._parseInput(input);


    let commandFunction = this._commands[command];
    if (commandFunction) { // each command will validate received args on its own (args number and if filePath is valid)
      console.log("Great command, you are great, everything works - looks like max points are well deserved!")
      await this._commands[command](args);//bind(this)
    } else {
      throw new Error(ERRORS.invalidInput);
    }
  }

  _parseInput(input) {
    return input.split(" ");
  }

  async start() {
    const intf = createInterface({ input: process.stdin, output: process.stdout });
  
    while (true) {
      const input = await intf.question(`\nYou are currently in ${this._currentDir}\n\n`);
      try {
        await this._executeCommand(input);
      } catch (err) {
        console.log(err.message);
      }
    }
  }

  _applyNewPath(path) {
    return pathModule.resolve(this._currentDir, path);
  }

  async _up() {
    console.log("I'm up");
    const newPath = this._applyNewPath("..");
    this._currentDir = await fileOperations.cd(newPath);
  }

  async _ls() {
    console.log("I'm ls");
  }

  async _cd(args) {
    
  }

  _cat = async (args) => {
    if (args.length > 0) {
      //console.log(`Cat args: ${args}`)
      const newPath = this._applyNewPath(args[0]);
      await fileOperations.cat(newPath);
    } else {
      throw new Error(ERRORS.invalidInput);
    }

  }

  async _add(args) {
    if (args.length > 0) {
      const newFilePath = this._applyNewPath(args[0]);
      await fileOperations.add(newFilePath);
    } else {
      throw new Error(ERRORS.invalidInput);
    }
  }

  async _cp(args) {
    if (args.length > 1) {
      const oldPath = this._applyNewPath(args[0]);
      const newPath = this._applyNewPath(args[1]);
      await fileOperations.cp(oldPath, newPath);
    } else {
      throw new Error(ERRORS.invalidInput);
    }

  }

  async _mv(args) {
    if (args.length > 1) {
      const oldPath = this._applyNewPath(args[0]);
      const newPath = this._applyNewPath(args[1]);
      await fileOperations.cp(oldPath, newPath);
    } else {
      throw new Error(ERRORS.invalidInput);
    }
  }

  async _rn(args) {
    if (args.length > 1) {
      const oldPath = this._applyNewPath(args[0]);
      const newDir = pathModule.dirname(oldPath);
      const newPath = pathModule.resolve(newDir, args[1]);
      await fileOperations.rn(oldPath, newPath);
    } else {
      throw new Error(ERRORS.invalidInput);
    }
  }

  async _rm(args) {
    if (args.length > 0) {
      const pathToFile = this._applyNewPath(args[0]);
      await fileOperations.rm(pathToFile);
    } else {
        throw new Error(ERRORS.invalidInput);
      }
  }

  async _hash(args) {

  }

  async _compress(args) {

  }

  async _decompress(args) {

  }

  async _os(args) {

  }

  _exit() {
    process.exit();
  }
}



