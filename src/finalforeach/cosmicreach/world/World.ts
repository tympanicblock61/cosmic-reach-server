import { Mutex } from 'async-mutex';

import { Serializable } from "../../../custom/JsonSerial";
import { Synchronized } from "../../../custom/Synchronized"
import { SaveLocation } from "../io/SaveLocation"
import { RuntimeInfo } from "../RuntimeInfo"

export class World implements Serializable {
    public defaultZoneId: string;
    private zoneMap: Map<String, Zone>;
    public worldFolderName: string;
    private worldDisplayName: string;
    public worldSeed: number;
    public players: Array<Player>;
    public lastPlayed: number;
    public worldCreated: number;
    public currentWorldTick: number;
    private canEnter: boolean;
    private sync: Synchronized = new Synchronized();
    //private zoneMapMutex: Mutex = new Mutex();

    public getDisplayName(): string {
        if (this.worldDisplayName == null) {
            return this.worldFolderName;
        }
        const maxLength: number = 25;
        if (this.worldDisplayName.length > maxLength) {
            return this.worldDisplayName.substring(0, maxLength - 3) + "...";
        }
        return this.worldDisplayName;
    }

    public async getZoneIfExists(zoneId: string): Promise<Zone | undefined> {
        return this.sync.synchronized("zoneMap", async () => {
            return this.zoneMap.get(zoneId);
        });

        //const release = await this.zoneMapMutex.acquire();
        //try {
        //    return this.zoneMap.get(zoneId);
        //}
        //finally {
        //    release();
        //}
    }

    public async getZoneCreateIfNull(zoneId: string): Promise<Zone> {
        return this.sync.synchronized("zoneMap", async () => {
            let zone: Zone = this.zoneMap.get(zoneId);
            if (zone == null && GameSingletons.isHost) {
                zone = Zone.loadZone(this, zoneId);
                this.zoneMap.set(zoneId, zone);
                ZoneLoaders.INSTANCE.addZoneLoader(zone);
            }
            return zone;
        });

        //const release = await this.zoneMapMutex.acquire();
        //try {
        //    let zone: Zone = this.zoneMap.get(zoneId);
        //    if (zone == null && GameSingletons.isHost) {
        //        zone = Zone.loadZone(this, zoneId);
        //        this.zoneMap.set(zoneId, zone);
        //        ZoneLoaders.INSTANCE.addZoneLoader(zone);
        //    }
        //    return zone;
        //}
        //finally {
        //    release();
        //}
    }

    public async getZones(): Promise<IterableIterator<Zone>> {
        return this.sync.synchronized("zoneMap", async () => {
            return this.zoneMap.values();
        });
    }

    public async getZoneIds(): Promise<IterableIterator<String>> {
        return this.sync.synchronized("zoneMap", async () => {
            return this.zoneMap.keys();
        });
    }

    public getDefaultZone(): Promise<Zone> {
        return this.getZoneCreateIfNull(this.defaultZoneId);
    }

    public static createNew(worldDisplayName: string, worldSeed: string, defaultZoneId: string, zoneGen: ZoneGenerator): World {
        let seed: number = 0;
        if (worldSeed != null && worldSeed.length > 0) {
            try {
                seed = Number.parseInt(worldSeed);
            }
            catch (ex) {
                seed = worldSeed.hashCode();
            }
        }
        else {
            seed = new Random().nextLong();
        }
        return createNew(worldDisplayName, seed, defaultZoneId, zoneGen);
    }

    public static String getFileSafeName(final String desiredFileName) {
        return FileUtils.getFileSafeName(desiredFileName);
    }

    public static World createNew(final String worldDisplayName, final long worldSeed, final String defaultZoneId, final ZoneGenerator zoneGen) {
        final World world = new World();
        world.worldDisplayName = worldDisplayName;
        world.worldFolderName = getFileSafeName(worldDisplayName);
        world.defaultZoneId = defaultZoneId;
        world.worldSeed = worldSeed;
        world.addNewZone(defaultZoneId, zoneGen);
        world.worldCreated = System.currentTimeMillis();
        world.lastPlayed = world.worldCreated;
        return world;
    }

    public void addNewZone(final String zoneId, final ZoneGenerator zoneGen) {
        if (zoneGen != null) {
            zoneGen.seed = this.worldSeed + zoneId.hashCode();
        }
        final Zone zone = new Zone(this, zoneId, zoneGen);
        this.addZone(zone);
    }

    public void addZone(final Zone zone) {
        this.zoneMap.put(zone.zoneId, zone);
        ZoneLoaders.INSTANCE.addZoneLoader(zone);
    }

    protected World() {
        this.zoneMap = new HashMap<String, Zone>();
        this.worldSeed = new Random().nextLong();
        this.players = new Array<Player>();
        this.canEnter = true;
    }

    public String getFullSaveFolder() {
        return SaveLocation.getWorldSaveFolderLocation(this);
    }

    public write(json: Record<string, unknown>): void {
        json["latestRegionFileVersion"] = 2;
        json["lastSavedVersion"] = RuntimeInfo.version;
        json["defaultZoneId"] = this.defaultZoneId;
        json["worldDisplayName"] = this.worldDisplayName;
        json["worldSeed"] = this.worldSeed;
        json["worldCreatedEpochMillis"] = this.worldCreated;
        json["lastPlayedEpochMillis"] = this.lastPlayed;
        json["worldTick"] = this.currentWorldTick;
        for (const z of this.getZones()) {
            z.saveZone(this);
        }
    }

    public read(final Json json, final JsonValue jsonData): void {
        try {
            this.canEnter = true;
            final int latestRegionFileVersion = jsonData.getInt("latestRegionFileVersion", 0);
            this.defaultZoneId = jsonData.getString("defaultZoneId", null);
            this.worldDisplayName = jsonData.getString("worldDisplayName", null);
            this.worldSeed = jsonData.getLong("worldSeed", 0L);
            this.currentWorldTick = jsonData.getLong("worldTick", 0L);
            this.worldCreated = jsonData.getLong("worldCreatedEpochMillis", 0L);
            this.lastPlayed = jsonData.getLong("lastPlayedEpochMillis", 0L);
            if (latestRegionFileVersion > 2) {
                throw new UnsupportedWorldException("Attempted to load a world \"" + this.worldDisplayName + "\" with file version:" + latestRegionFileVersion + " but can only support worlds up to file version 2");
            }
        }
        catch (final Exception ex) {
            Logger.error(ex);
            this.canEnter = false;
        }
    }

    public String getWorldFolderName() {
        return this.worldFolderName;
    }

    public long getCurrentWorldTick() {
        return this.currentWorldTick;
    }

    public long getDayNumber() {
        final double currentTimeSeconds = this.getCurrentWorldTick() * 0.05f;
        final int cycleLength = 1920;
        return Math.floorDiv((int)currentTimeSeconds, cycleLength) + 1;
    }

    public boolean canEnter() {
        return this.canEnter && ZoneGenerator.hasGenerator(this.defaultZoneId);
    }
}
