
export function getDiffInSecs(cur: number | null, prev: number | null): number {
    if (!cur || !prev) {
        return 0
    }
    return Math.floor((cur - prev) / 1000);
}

export function formatTime(secondsDiff: number): string {
    const minutes = Math.floor(secondsDiff / 60);
    const seconds = secondsDiff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

