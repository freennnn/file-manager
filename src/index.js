import getUsername from "./username.js";
import { FileManager } from "./main.js";

const fileManager = new FileManager();

process.on("SIGINT", () => {
  console.log("\nCaught interrupt signal (Ctrl+C). Closing interface...");
  fileManager.closeInterface(); // Close readline only
});

process.on("SIGTERM", () => {
  console.log("\nCaught termination signal (SIGTERM). Closing interface...");
  fileManager.closeInterface(); // Close readline only
});

function sayHi() {
  console.log(`Welcome to the File Manager, ${getUsername()}!`);
}

function sayBye() {
  console.log(`Thank you for using File Manager, ${getUsername()}, goodbye!`);
}

sayHi();
process.on("exit", () => sayBye());

await fileManager.start();
