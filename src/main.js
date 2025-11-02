import { createInterface } from "readline/promises";
import ERRORS from "./errors.js";
import os from "os";
import * as pathModule from "path";
import * as fileOperations from "./commands/fileOperations.js";
import * as dirNavigation from "./commands/dirNavigation.js";
import calculateHash from "./commands/hash.js";
import printSystem from "./commands/system.js";
import { compress, decompress } from "./commands/compress.js";

export class FileManager {
  constructor() {
    this._currentDir = os.homedir();
    this.rl = null; // Initialize readline interface property

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
    };
  }

  async _executeCommand(input) {
    const [command, ...args] = this._parseInput(input);

    let commandFunction = this._commands[command];
    if (commandFunction) {
      // each command will validate received args on its own (args number and if filePath is valid)
      await this._commands[command](args); //bind(this)
      console.log(
        "success: great command, you are great, everything works"
      );
    } else {
      throw new Error(ERRORS.invalidInput);
    }
  }

  _parseInput(input) {
    // Handle quoted strings with spaces: cd "My Documents" or cat 'my file.txt'
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const args = [];
    let match;

    while ((match = regex.exec(input)) !== null) {
      // match[1] is the content inside double quotes
      // match[2] is the content inside single quotes
      // match[0] is the unquoted string
      args.push(match[1] || match[2] || match[0]);
    }

    return args;
  }

  async start() {
    // Store the interface on the instance
    this.rl = createInterface({ input: process.stdin, output: process.stdout });

    while (true) {
      let input = null;
      try {
        // Use the instance property
        input = await this.rl.question(
          `\nYou are currently in ${this._currentDir}\n`
        );
      } catch (err) {
        // Check if the error is the specific AbortError from Ctrl+C
        if (err && err.code === "ABORT_ERR") {
          // Ctrl+C was pressed, break the loop gracefully.
          // The 'exit' event handler in index.js will print the goodbye message.
          break;
        } else {
          // Re-throw other errors if needed, or log them
          console.log("Error during input:", err);
          break; // Or decide on other error handling
        }
      }

      // Existing command execution logic
      try {
        await this._executeCommand(input);
      } catch (err) {
        console.log(err.message); // Log command execution errors
      }
    }

    // Ensure the interface is closed if the loop exits unexpectedly (optional, as SIGINT/SIGTERM handlers also do this)
    this.closeInterface();
  }

  _applyNewPath(path) {
    return pathModule.resolve(this._currentDir, path);
  }

  async _up() {
    const newPath = this._applyNewPath("..");
    this._currentDir = await dirNavigation.cd(newPath);
  }

  async _ls() {
    await dirNavigation.ls(this._currentDir);
  }

  async _cd(args) {
    if (args.length > 0) {
      const newDirPath = this._applyNewPath(args[0]);
      this._currentDir = await dirNavigation.cd(newDirPath);
    } else {
      throw new Error(ERRORS.invalidInput);
    }
  }

  _cat = async (args) => {
    if (args.length > 0) {
      const filePath = this._applyNewPath(args[0]);
      await fileOperations.cat(filePath);
    } else {
      throw new Error(ERRORS.invalidInput);
    }
  };

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
      const oldPath = this._applyNewPath(args[0]); // path to file
      const newPath = pathModule.resolve(
        this._applyNewPath(args[1]),
        pathModule.basename(oldPath)
      ); // args[1] - new directory path
      await fileOperations.cp(oldPath, newPath);
    } else {
      throw new Error(ERRORS.invalidInput);
    }
  }

  async _mv(args) {
    if (args.length > 1) {
      const oldPath = this._applyNewPath(args[0]); // args[0] - path_to_file
      const newPath = pathModule.resolve(
        this._applyNewPath(args[1]),
        pathModule.basename(oldPath)
      ); // args[1] - path_to_new_directory
      await fileOperations.mv(oldPath, newPath);
    } else {
      throw new Error(ERRORS.invalidInput);
    }
  }

  async _rn(args) {
    if (args.length > 1) {
      const oldPath = this._applyNewPath(args[0]); // path to new file
      const newDir = pathModule.dirname(oldPath);
      const newPath = pathModule.resolve(newDir, args[1]); // cause second arg is just a new file Name
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
    if (args.length > 0) {
      const pathToFile = this._applyNewPath(args[0]);
      await calculateHash(pathToFile);
    } else {
      throw new Error(ERRORS.invalidInput);
    }
  }

  async _compress(args) {
    if (args.length > 1) {
      const pathToFile = this._applyNewPath(args[0]);
      const pathToDestination = this._applyNewPath(args[1]);
      await compress(pathToFile, pathToDestination);
    } else {
      throw new Error(ERRORS.invalidInput);
    }
  }

  async _decompress(args) {
    if (args.length > 1) {
      const pathToFile = this._applyNewPath(args[0]);
      const pathToDestination = this._applyNewPath(args[1]);
      await decompress(pathToFile, pathToDestination);
    } else {
      throw new Error(ERRORS.invalidInput);
    }
  }

  async _os(args) {
    if (args.length > 0) {
      printSystem(args[0].slice(2));
    } else {
      throw new Error(ERRORS.invalidInput);
    }
  }

  _exit() {
    process.exit();
  }

  // Add a method to close the interface
  closeInterface() {
    if (this.rl) {
      this.rl.close();
      this.rl = null; // Clear the reference
    }
  }
}
