
export function getDiffInSecs(curTime: number | null, prevTime: number | null): number {
    if (!curTime || !prevTime) {
        return 0
    }
    return Math.floor((curTime - prevTime) / 1000);
}

export function formatSecsToMinutes(secondsDiff: number): string {
    const minutes = Math.floor(secondsDiff / 60);
    const seconds = secondsDiff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatMetresInKm(metres: number): string {
    return (metres / 1000).toFixed(2)
}

export function formatSpeed(speedInMetresPerSec: number): string {
    const secsPerMetres = 1 / speedInMetresPerSec
    const minsPerKm = (1000 / 60) * secsPerMetres
    return minsPerKm.toFixed(2)
}

export function timestampToDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString()
}

export function timestampToTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString()
}

