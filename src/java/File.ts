import * as fs from "fs";
import * as path from "path";

export class File {
    constructor(public filePath: string) { }

    exists(): boolean {
        return fs.existsSync(this.filePath);
    }

    isFile(): boolean {
        return this.exists() && fs.statSync(this.filePath).isFile();
    }

    isDirectory(): boolean {
        return this.exists() && fs.statSync(this.filePath).isDirectory();
    }

    mkdirs(): void {
        fs.mkdirSync(this.filePath, { recursive: true });
    }

    delete(): void {
        if (this.isFile()) fs.unlinkSync(this.filePath);
        else if (this.isDirectory()) fs.rmdirSync(this.filePath, { recursive: true });
    }

    getName(): string {
        return path.basename(this.filePath);
    }

    getParent(): string {
        return path.dirname(this.filePath);
    }

    getAbsolutePath(): string {
        return path.resolve(this.filePath);
    }

    read(): string | null {
        if (this.isFile()) {
            return fs.readFileSync(this.filePath, { encoding: 'utf-8' });
        }
        return null;
    }
}