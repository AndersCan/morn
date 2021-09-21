import { spawn } from "child_process";
import path from "path";
import chalk from "chalk";

interface SpawnProcessProps {
  cwd: string;
  start: string;
  startArgs: string[];
  onLog: (s: string) => void;
  onExit: (code: number) => void;
}
export function spawnProcess(props: SpawnProcessProps) {
  const { cwd, start, startArgs, onLog, onExit } = props;
  const mySpawn = spawn(start, startArgs, {
    cwd,
  });

  const prefix = cwd.replace(path.dirname(cwd), "");
  handleStream(prefix, mySpawn, onLog);

  mySpawn.stderr.on("data", (data) => {
    onLog(`${chalk.bgRed(prefix)} stderr: ${data}`);
  });

  mySpawn.on("close", (code) => {
    onLog(`${chalk.bgGray(prefix)} - exited (${code})`);
    onExit(code);
  });

  return mySpawn;
}

async function handleStream(
  prefix: string,
  spawned: ReturnType<typeof spawn>,
  onLog: (s: string) => void
) {
  if (!spawned.stdout) {
    return;
  }
  for await (const data of spawned.stdout) {
    onLog(
      `${chalk.bgGray(prefix)} - ${data.toString("utf-8").replace(/\n$/g, "")}`
    );
  }
}
