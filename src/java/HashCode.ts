export function HashCode(value: any): number {
    if (value === null || value === undefined) {
        return 0;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return simpleHashCode(value.toString());
    }
    return simpleHashCode(JSON.stringify(value));
}

function simpleHashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}