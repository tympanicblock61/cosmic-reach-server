import * as fs from "fs";
import * as path from "path";

import { File } from "../../../java/File"
import { SaveLocation } from "../io/SaveLocation"
class ServerLauncher {
    public static main(args: string[]) {
        SaveLocation.saveLocationOverride = __dirname;
        for (let i = 0; i < args.length; ++i) {
            let arg: string = args[i];
            if (arg=="-s" || arg=="--save-location") {
                SaveLocation.saveLocationOverride = args[i + 1];
                new File(SaveLocation.saveLocationOverride).mkdirs();
            }
        }
        ServerSingletons.create();
        let serverWorldName: string = "server-world-1";
        GameSingletons.world = ChunkLoader.loadWorld(serverWorldName);
        if (GameSingletons.world == null) {
            Logger.info("Creating new world.");
            let selectedZoneId: string = "base:earth";
            GameSingletons.world = World.createNew(serverWorldName, null, selectedZoneId, ZoneGenerator.getZoneGenerator(selectedZoneId));
        }
        else {
            Logger.info("Loaded world.");
            ZoneLoaders.INSTANCE.addZoneLoader(GameSingletons.world.getDefaultZone());
        }
        TickRunner.INSTANCE.continueTickThread();
        let server: NettyServer = new NettyServer();
        ServerSingletons.SERVER = server
        ServerSingletons.SERVER.run();
    }
}
