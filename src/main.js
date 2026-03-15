import os from "node:os";
import { startRepl } from "./repl.js";

const initialDir = os.homedir();
await startRepl({ initialDir });
