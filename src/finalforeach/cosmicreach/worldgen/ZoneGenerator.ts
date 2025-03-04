
import { Random } from "../../../java/Random"
import { Synchronized } from "../../../custom/Synchronized"

abstract class ZoneGenerator {
    private static readonly sync: Synchronized = new Synchronized();
    private static readonly REGISTER_ZONE_LOCK: Object = new Object();
    private static allZoneGenerators: Map<string, Function>;
    private static allZoneIds: Array<string> = new Array<string>();
    private static zoneIdsAndNames: Map<string,string> = new Map<string, string>();
    public static readonly CHUNK_WIDTH: number = 16;
    public seed: number;
    protected spawnRandom: Random;
    
    public constructor() {
        this.seed = new Random().nextLong();
        this.spawnRandom = new Random();
    }
    
    public abstract getSaveKey(): string;
    
    public abstract create(): void;
    
    public abstract generateForChunkColumn(p0: Zone, p1: ChunkColumn): void;
    
    public static getZoneGenerator(zoneGenSaveKey: string): ZoneGenerator;
    
    public static getZoneGenerator(zoneGenSaveKey: string, zoneSeed: number = 0): ZoneGenerator {
        this.registerZoneGenerators();
        const worldGenClass: Function | undefined = ZoneGenerator.allZoneGenerators.get(zoneGenSaveKey);
        try {
            const worldGen: ZoneGenerator = (worldGenClass as Function)();
            worldGen.seed = zoneSeed;
            worldGen.create();
            return worldGen;
        }
        catch (e) {
            throw new Error(`Could not find zone generator for worldGenSaveKey: ${zoneGenSaveKey}\n${e}`);
        }
    }
    
    public static getZoneGeneratorSaveKeys(): Array<string> {
        this.registerZoneGenerators();
        return ZoneGenerator.allZoneIds;
    }
    
    public static getZoneGeneratorName(id: string): string | undefined {
        return ZoneGenerator.zoneIdsAndNames.get(id);
    }
    
    protected getBlockStateInstance(blockStateId: string): BlockState {
        return BlockState.getInstance(blockStateId, MissingBlockStateResult.MISSING_OBJECT);
    }
    
    public static registerZoneGenerators(): void {
        if (ZoneGenerator.allZoneGenerators != null) {
            return;
        }

        this.sync.synchronized(ZoneGenerator.REGISTER_ZONE_LOCK, async () => {
            if (ZoneGenerator.allZoneGenerators != null) {
                return;
            }
            ZoneGenerator.allZoneGenerators = new Map<string,Function> ();
            registerZoneGenerator(new EarthZoneGenerator());
            registerZoneGenerator(new NostalgicIslandZoneGenerator());
            registerZoneGenerator(new MoonZoneGenerator());
            registerZoneGenerator(new FlatZoneGenerator());
        });
    }
    
    public static registerZoneGenerator(zoneGenerator: ZoneGenerator): void {
        try {
            if (zoneGenerator.constructor != null) {
                const saveKey: string = zoneGenerator.getSaveKey();
                ZoneGenerator.zoneIdsAndNames.set(saveKey, zoneGenerator.getName());
                ZoneGenerator.allZoneIds.push(saveKey);
                ZoneGenerator.allZoneGenerators.set(saveKey, Object.getPrototypeOf(zoneGenerator).constructor);
            }
        }
        catch (e) {
            throw new Error(`${Object.getPrototypeOf(zoneGenerator).constructor} requires a zero-arg constructor.\n${e}`);
        }
    }
    
    protected abstract getName(): string;
    
    public abstract getDefaultRespawnYLevel(): number;
    
    public static hasGenerator(zoneId: string): boolean {
        this.registerZoneGenerators();
        return ZoneGenerator.allZoneGenerators.has(zoneId);
    }
    
    public getSpawnPoint(spawnpoint: Vector2, attempt: number): Vector2 {
        this.spawnRandom.setSeed(this.seed + attempt);
        const maxDist: number = (5000 + attempt * 100);
        const dist: number = this.spawnRandom.nextFloat(maxDist);
        spawnpoint.set(this.spawnRandom.nextFloat(), this.spawnRandom.nextFloat()).nor().scl(dist);
        return spawnpoint;
    }
}
