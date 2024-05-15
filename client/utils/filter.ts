import { Position } from "./stores/runStore";

// Kalman filter for smoothing out the data 
// WARN: doesnt work very well - the signal only gets more spiky 

// Taken from the the code in this article and transcribed to TypeScript: 
// https://blog.expo.dev/a-complete-guide-to-displaying-and-normalizing-location-data-in-react-native-7e448c760fc2

const _toRadians = (number: number) => number * Math.PI / 180;

// DOCUMENTATION: http://www.movable-type.co.uk/scripts/latlong.html
export const _calculateGreatCircleDistance = (locationA: Position, locationZ: Position) => {
    const lat1 = locationA.lat;
    const lon1 = locationA.long;
    const lat2 = locationZ.lat;
    const lon2 = locationZ.long;

    const p1 = _toRadians(lat1);
    const p2 = _toRadians(lat2);
    const deltagamma = _toRadians(lon2 - lon1);
    const R = 6371e3;
    const d =
        Math.acos(
            Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(deltagamma)
        ) * R;

    return isNaN(d) ? 0 : d;
}

type KalmanPos = Position & { variance: number | undefined }

const kalman = (location: Position, lastLocation: KalmanPos | undefined, constant: number) => {
    const accuracy = Math.max(location.accuracy!, 1)
    let result: KalmanPos = {
        ...location,
        variance: lastLocation?.variance ?? (accuracy * accuracy)
    }

    if (lastLocation) {
        const timestampInc = (location.timestamp - lastLocation.timestamp) / 1000.0

        if (timestampInc > 0) {
            const distDiff = _calculateGreatCircleDistance(location, lastLocation)
            const velocity = (distDiff / timestampInc) * constant
            result.variance! += timestampInc * velocity * velocity / 1000
        }
        const resVar = result.variance!

        const k = result.variance! / (resVar + (accuracy * accuracy))
        result.lat += k * (location.lat - lastLocation.lat)
        result.long += k * (location.long - lastLocation.long)
        result.variance = (1 - k) * resVar
    }

    return {
        ...location,
        lat: result.lat,
        long: result.long,
        variance: result.variance,
    }
}

const runKalmanOnLocations = (poss: Position[], kalmanConstant: number): Position[] => {
    let lastLocation: KalmanPos | undefined = undefined
    return poss
        .map(pos => {
            lastLocation = kalman(
                pos,
                lastLocation,
                kalmanConstant
            )
            return lastLocation
        }).map(pos => {
            const { variance, ...rest } = pos
            return rest
        })
}

export default runKalmanOnLocations

