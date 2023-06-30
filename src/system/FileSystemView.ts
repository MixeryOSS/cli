import * as path from "node:path";
import * as fs from "node:fs";

export class FileSystemView {
    constructor(public readonly root: string) {}

    file(f: string) { return path.resolve(this.root, f); }
    exists(f: string) { return fs.existsSync(this.file(f)); }

    json(f: string): Promise<any>;
    json(f: string, data: any): Promise<void>;
    async json(f: string, data?: any) {
        if (data == null) return JSON.parse(await fs.promises.readFile(this.file(f), "utf-8"));
        else await fs.promises.writeFile(this.file(f), JSON.stringify(data, null, 4), "utf-8");
    }
}