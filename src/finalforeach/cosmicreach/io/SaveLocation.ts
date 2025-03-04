import { exec } from 'child_process';
import * as os from "os";
import * as path from 'path';


import { World } from "../world/World"
import { File } from "../../../java/File";
import { RuntimeInfo } from "../RuntimeInfo"

export class SaveLocation {
    public static saveLocationOverride: string;

    public static OpenFolderWithFileManager(folder: File) {
        if (!folder.isDirectory()) {
            throw new Error(`${folder.getAbsolutePath()} is not a directory! Does exist: ${folder.exists()}`);
        }
        try {
            if (RuntimeInfo.isMac) {
                exec(`open "${folder.getAbsolutePath()}"`);
                return;
            }
        }
        catch (ex) {
            if (RuntimeInfo.isWindows) {
                exec(`explorer.exe ${folder.getAbsolutePath()}`);
                return;
            }
            throw ex;
        }
    }
    
    public static getSaveFolder(): File {
        const dir: File = new File(this.getSaveFolderLocation());
        dir.mkdirs();
        return dir;
    }
    
    public static getWorldSaveFolderLocation(world: World): string;
    public static getWorldSaveFolderLocation(worldFolderName: string | World): string {
        if (worldFolderName instanceof World) {
            return this.getWorldSaveFolderLocation(world.getWorldFolderName());
        } else {
            return this.getAllWorldsSaveFolderLocation() + "/" + worldFolderName;
        }
    }
    
    public static getAllWorldsSaveFolderLocation(): string {
        const rootFolderName: string = this.getSaveFolderLocation();
        return rootFolderName + "/worlds";
    }
    
    public static getSaveFolderLocation(): string {
        if (SaveLocation.saveLocationOverride != null) {
            return SaveLocation.saveLocationOverride;
        }
        const osName: string = os.type().toLowerCase();
        let rootFolder: string;
        if (osName.includes("windows")) {
            rootFolder = process.env.LOCALAPPDATA as string;
        }
        else if (osName.includes("mac")) {
            rootFolder = process.env.HOME + "/Library";
        }
        else {
            rootFolder = process.env.XDG_DATA_HOME as string;
            if (rootFolder == null || rootFolder.length == 0) {
                rootFolder = process.env.HOME + "/.local/share";
            }
        }
        const saveFolder: string = path.resolve(rootFolder, "cosmic-reach");
        const dir: File = new File(saveFolder);
        dir.mkdirs();
        return SaveLocation.saveLocationOverride = saveFolder;
    }
    
    public static getScreenshotFolderLocation(): string {
        return this.getSaveFolderLocation() + "/screenshots";
    }
}
