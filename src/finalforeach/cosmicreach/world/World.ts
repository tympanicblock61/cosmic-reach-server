import { Mutex } from 'async-mutex';

import { Serializable } from "../../../custom/JsonSerial";
import { Synchronized } from "../../../custom/Synchronized"
import { SaveLocation } from "../io/SaveLocation"
import { RuntimeInfo } from "../RuntimeInfo"
import { HashCode } from "../../../java/HashCode"
import { Random } from "../../../java/Random"

export class World implements Serializable {
    public defaultZoneId: string | null;
    private zoneMap: Map<String, Zone>;
    public worldFolderName: string;
    private worldDisplayName: string | null;
    public worldSeed: number;
    public players: Array<Player>;
    public lastPlayed: number;
    public worldCreated: number;
    public currentWorldTick: number;
    private _canEnter: boolean;
    private sync: Synchronized = new Synchronized();

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
        return this.getZoneCreateIfNull(String(this.defaultZoneId));
    }

    public static getFileSafeName(desiredFileName: string): string {
        return FileUtils.getFileSafeName(desiredFileName);
    }

    public static createNew(worldDisplayName: string, worldSeed: string, defaultZoneId: string, zoneGen: ZoneGenerator): World;
    public static createNew(worldDisplayName: string, worldSeed: string | number, defaultZoneId: string, zoneGen: ZoneGenerator): World {
        if (typeof worldSeed === "string") {
            if (worldSeed != null && worldSeed.length > 0) {
                try {
                    worldSeed = Number.parseInt(worldSeed);
                }
                catch (ex) {
                    worldSeed = HashCode(worldSeed);
                }
            }
            else {
                worldSeed = new Random().nextLong();
            }
        }

        const world: World = new World();
        world.worldDisplayName = worldDisplayName;
        world.worldFolderName = this.getFileSafeName(worldDisplayName);
        world.defaultZoneId = defaultZoneId;
        world.worldSeed = worldSeed;
        world.addNewZone(defaultZoneId, zoneGen);
        world.worldCreated = new Date().getTime();
        world.lastPlayed = world.worldCreated;
        return world;
    }

    public addNewZone(zoneId: string, zoneGen: ZoneGenerator): void {
        if (zoneGen != null) {
            zoneGen.seed = this.worldSeed + HashCode(zoneId);
        }
        const zone: Zone = new Zone(this, zoneId, zoneGen);
        this.addZone(zone);
    }

    public addZone(zone: Zone): void {
        this.zoneMap.set(zone.zoneId, zone);
        ZoneLoaders.INSTANCE.addZoneLoader(zone);
    }

    protected constructor() {
        this.zoneMap = new Map<String, Zone>();
        this.worldSeed = new Random().nextLong();
        this.players = new Array<Player>();
        this._canEnter = true;

        // these had to be set
        this.defaultZoneId = null;
        this.worldFolderName = "";
        this.worldDisplayName = null;
        this.lastPlayed = 0;
        this.worldCreated = 0;
        this.currentWorldTick = 0;
    }

    public getFullSaveFolder(): string {
        return SaveLocation.getWorldSaveFolderLocation(this);
    }

    public async write(json: Record<string, unknown>): Promise<void> {
        json["latestRegionFileVersion"] = 2;
        json["lastSavedVersion"] = RuntimeInfo.version;
        json["defaultZoneId"] = this.defaultZoneId;
        json["worldDisplayName"] = this.worldDisplayName;
        json["worldSeed"] = this.worldSeed;
        json["worldCreatedEpochMillis"] = this.worldCreated;
        json["lastPlayedEpochMillis"] = this.lastPlayed;
        json["worldTick"] = this.currentWorldTick;
        for (const z of await this.getZones()) {
            z.saveZone(this);
        }
    }

    public async read(json: Record<string, unknown>): Promise<void> {
        try {
            this._canEnter = true;
            const latestRegionFileVersion: number = json["latestRegionFileVersion"] as number || 0;
            this.defaultZoneId = json["defaultZoneId"] as string || null;
            this.worldDisplayName = json["worldDisplayName"] as string || null;
            this.worldSeed = json["worldSeed"] as number || 0;
            this.currentWorldTick = json["worldTick"] as number || 0;
            this.worldCreated = json["worldCreatedEpochMillis"] as number || 0;
            this.lastPlayed = json["lastPlayedEpochMillis"] as number || 0;
            if (latestRegionFileVersion > 2) {
                throw new Error(`Attempted to load a world "${this.worldDisplayName}" with file version:"${latestRegionFileVersion}" but can only support worlds up to file version 2`);
            }
        }
        catch (ex) {
            Logger.error(ex);
            this._canEnter = false;
        }
    }

    public getWorldFolderName(): string {
        return this.worldFolderName;
    }

    public getCurrentWorldTick(): number {
        return this.currentWorldTick;
    }

    public getDayNumber(): number {
        const currentTimeSeconds: number = this.getCurrentWorldTick() * 0.05;
        const cycleLength: number = 1920;
        return Math.floor(currentTimeSeconds / cycleLength) + 1;
    }

    public canEnter(): boolean {
        return this._canEnter && ZoneGenerator.hasGenerator(this.defaultZoneId);
    }
}
