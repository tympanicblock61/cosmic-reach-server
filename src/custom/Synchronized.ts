import { Mutex } from 'async-mutex';

export class Synchronized {
    private mutexMap: Record<any, Mutex> = {};

    private getMutex(key: any): Mutex {
        if (!this.mutexMap[key]) {
            this.mutexMap[key] = new Mutex();
        }
        return this.mutexMap[key];
    }

    public async synchronized<T>(key: any, fn: () => Promise<T>): Promise<T> {
        const mutex = this.getMutex(key);
        const release = await mutex.acquire();
        try {
            return await fn();
        } finally {
            release();
        }
    }
}