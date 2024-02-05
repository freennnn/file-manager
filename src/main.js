import { createInterface } from "readline/promises";
import ERRORS from "./errors.js";
import os from "os";
import * as pathModule from "path";

export class FileManager {
  constructor() {
    this._currentDir = os.homedir();
    this._commands = {
      up: this._up,
      ls: this._ls,
      cd: this._cd, // 1 arg
      cat: this._cat, // 1 arg
      add: this._add, // 1 arg
      cp: this._cp, // 2 args
      ".exit": this._exit,
      mv: this._mv, // 2 args
      rm: this._rm, // 1 arg
      rn: this._rn, // 2 args
      hash: this._hash, // 1 arg
      compress: this._compress, // 2 args
      decompress: this._decompress, // 2 args
      os: this._os, // 1 arg
    }
  }

  async _executeCommand(input) {
    const [command, ...args] = this._parseInput(input);
    let commandFunction = this._commands[command];
    if (commandFunction) { // each command will validate received args on its own (args number and if filePath is valid)
      console.log("Great command, everything works - looks like max points are well deserved!")
      await commandFunction(args);
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
      const input = await intf.question(`You are currently in ${this._currentDir}\n\n`);
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

  async _up() {
    console.log("I'm up");
  }

  async _ls() {
    console.log("I'm ls");
  }

  async _cd(args) {
    
  }

  async _cat(args) {
    console.log(`I'm cat with ${args}`);
  }

  async _add(args) {

  }

  async _cp(args) {

  }

  async _mv(args) {

  }

  async _rn(args) {

  }

  async _rm(args) {

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



