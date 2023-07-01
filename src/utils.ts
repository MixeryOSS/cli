import * as childProcess from "node:child_process";

export async function runCommand(command: string, cwd = ".") {
    await new Promise((resolve, reject) => {
        let proc = childProcess.exec(command, { cwd });
        proc.stdout.pipe(process.stdout);
        proc.stderr.pipe(process.stderr);
        proc.on("error", reject);
        proc.on("exit", (code, signal) => {
            if (code != 0) reject(new Error(`Program exited with code ${code}`));
            else resolve(null);
        });
    });
}