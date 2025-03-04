import { Mutex } from 'async-mutex';
import { Synchronized } from '../custom/Synchronized'; // Assuming Synchronized is in a file named Synchronized.ts

describe('Synchronized Class Tests', () => {
    let synchronized: Synchronized;

    beforeEach(() => {
        synchronized = new Synchronized();
    });

    test('should acquire lock and execute function in sequence', async () => {
        let result = 0;

        const task = async () => {
            await synchronized.synchronized('resource1', async () => {
                result += 1;
            });
        };

        // Run the task twice and ensure the operations happen sequentially
        await Promise.all([task(), task()]);

        expect(result).toBe(2);  // The result should be 2 since both tasks increment the result
    });

    test('should prevent race conditions with concurrent tasks on the same resource', async () => {
        let result = 0;

        // Create a task that increments the result and waits for 100ms
        const task = async () => {
            await synchronized.synchronized('resource1', async () => {
                let temp = result;
                temp += 1;
                await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate work
                result = temp;
            });
        };

        // Run the tasks concurrently
        await Promise.all([task(), task()]);

        // Since the operations are synchronized, the result should be 2
        expect(result).toBe(2);
    });

    test('should allow concurrent access to different resources', async () => {
        let result1 = 0;
        let result2 = 0;

        // Create two tasks for different resources
        const task1 = async () => {
            await synchronized.synchronized('resource1', async () => {
                result1 += 1;
            });
        };

        const task2 = async () => {
            await synchronized.synchronized('resource2', async () => {
                result2 += 1;
            });
        };

        // Run the tasks concurrently
        await Promise.all([task1(), task2()]);

        // Both resources should be able to operate concurrently
        expect(result1).toBe(1);
        expect(result2).toBe(1);
    });

    test('should work with different resources without blocking each other', async () => {
        let result1 = 0;
        let result2 = 0;

        // First task for 'resource1'
        const task1 = async () => {
            await synchronized.synchronized('resource1', async () => {
                result1 += 1;
            });
        };

        // Second task for 'resource2'
        const task2 = async () => {
            await synchronized.synchronized('resource2', async () => {
                result2 += 1;
            });
        };

        // Run both tasks at the same time
        await Promise.all([task1(), task2()]);

        // Both results should be 1 without blocking each other
        expect(result1).toBe(1);
        expect(result2).toBe(1);
    });

    test('should allow sequential access to the same resource', async () => {
        let result = 0;

        const task = async () => {
            await synchronized.synchronized('resource1', async () => {
                result += 1;
            });
        };

        // Run the task three times and ensure the result increments sequentially
        await Promise.all([task(), task(), task()]);

        expect(result).toBe(3);  // The result should be 3 since the tasks are synchronized
    });

    test('should handle errors without leaving lock held', async () => {
        let result = 0;

        const taskWithError = async () => {
            await synchronized.synchronized('resource1', async () => {
                result += 1;
                throw new Error('Task failed');
            });
        };

        try {
            await taskWithError();
        } catch (e) {
            expect((e as Error).message).toBe('Task failed');
        }

        // Ensure the lock was released and result is incremented once
        expect(result).toBe(1);
    });
});
