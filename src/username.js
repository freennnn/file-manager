
export default function getUsername() {
  const args = process.argv.slice(2);
  let username = 'Linus Torvalds';
  if (args.length > 0) {
    let usernameArgs = args.filter(arg => arg.includes("--username="));
    if (usernameArgs.length > 0) {
      username = usernameArgs.pop().replace("--username=", "");
    }
  }
  return username;
}