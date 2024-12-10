export interface GameResult {
    victory: boolean;
    timestamp: string;
}

export function isGameResult(obj: unknown): obj is GameResult {
    return(
        typeof obj === 'object' &&
        obj !== null &&
        'victory' in obj &&
        'timestamp' in obj &&
        typeof (obj as GameResult).victory === 'boolean' &&
        typeof (obj as GameResult).timestamp === 'string' &&
        !isNaN(Date.parse((obj as GameResult).timestamp))
    );
}

export function isGameResultArray(arr: unknown): arr is GameResult[]{
    return Array.isArray(arr) && arr.every(isGameResult)
}