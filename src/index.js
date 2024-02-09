import getUsername from "./username.js";
import { FileManager } from "./main.js";

function sayHi() {
  console.log(`Welcome to the File Manager, ${getUsername()}!`)
}

function sayBye() {
  console.log(`Thank you for using File Manager, ${getUsername()}, goodbye!`)
}

sayHi();
process.on("exit", () => sayBye());

const fileManager = new FileManager;
await fileManager.start();