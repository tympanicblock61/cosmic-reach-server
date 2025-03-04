import * as os from "os";
import { File } from "../../java/File"

export class RuntimeInfo {
    private static readonly osName: string = os.type().toLowerCase();
    public static readonly isMac: Boolean = this.osName.includes("mac");
    public static readonly isWindows: Boolean = this.osName.includes("windows");
    public static readonly version: string = new File("build_assets/version.txt").read() || "";
    public static GL30Supported: Boolean;
    public static gameVariant: string;
    //private static DecimalFormat decimalFormat;
    //private static StringBuilder sb;
    //private static readonly IntBuffer glInt;

}