import os from "node:os";
import path from "node:path";

export function resolvePath(currentDir, maybeRelativeOrAbsolutePath) {
  if (typeof maybeRelativeOrAbsolutePath !== "string") {
    return null;
  }

  // Node doesn't expand "~" like shells do, so we do it here for convenience:
  // "~" or "~/<something>" (also supports "~\<something>" on Windows).
  let input = maybeRelativeOrAbsolutePath;
  if (input === "~") {
    input = os.homedir();
  } else if (input.startsWith("~/") || input.startsWith("~\\")) {
    input = path.join(os.homedir(), input.slice(2));
  }

  return path.resolve(currentDir, input);
}

