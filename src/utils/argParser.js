function invalidInput() {
  const err = new Error("Invalid input");
  err.code = "INVALID_INPUT";
  return err;
}

export function parseFlags(args) {
  const flags = {};

  for (let i = 0; i < args.length; i++) {
    const tok = args[i];
    if (!tok.startsWith("--")) {
      throw invalidInput();
    }

    const key = tok.slice(2);
    if (!key) throw invalidInput();

    if (key === "save") {
      flags.save = true;
      continue;
    }

    const val = args[i + 1];
    if (val == null || String(val).startsWith("--")) {
      throw invalidInput();
    }
    flags[key] = String(val);
    i++;
  }

  return flags;
}

