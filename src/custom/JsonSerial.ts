export interface Serializable {
    write(json: Record<string, unknown>): void;
    read(json: Record<string, unknown>): void;
}