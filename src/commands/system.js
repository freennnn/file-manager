import os from "os";
import ERRORS from "../errors.js";

export default function printSystem(param) {
  switch(param) {
    case "EOL":
      console.log("EOL:", JSON.stringify(os.EOL)); // without strigify we'll just print a new empty line
      break;
    case "cpus":
      console.log(`overall ${os.cpus().length} cpus:`);
      console.table(os.cpus().map(cpu => ({ Model: cpu.model, ClockRate: `${Math.round(cpu.speed/100)/10} GHz`})));
      break;
    case "homedir":
      console.log(os.homedir());
      break;
    case "username":
      console.log(os.userInfo().username);
      break;
    case "architecture":
      console.log(process.arch);
      break;
    default:
      console.log(`${param} is not supported by os command`);
      throw new Error(ERRORS.invalidInput);
  }
}