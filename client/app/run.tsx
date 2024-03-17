import { useEffect, useRef, useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { getPreciseDistance } from 'geolib';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';

type Position = {
    latitude: number,
    longitude: number,
    timestamp: number
}

export default function Run() {
    let { goal, name, unit } = useLocalSearchParams<{ goal: string, name: string, unit: string }>()

    const startTimeRef = useRef((new Date()).getTime())
    let [curTime, setCurTime] = useState(startTimeRef.current)

    const [errorMsg, setErrorMsg] = useState<null | string>(null);

    const [totalDistance, setTotalDistance] = useState(0); // in meters
    const [totalDuration, setTotalDuration] = useState(0);
    const [positions, setPositions] = useState<Position[]>([]);

    // track time
    useEffect(() => {
        const interval = setInterval(() => {
            setCurTime((new Date()).getTime());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const diffInSeconds = Math.floor((curTime - startTimeRef.current) / 1000);
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const updatePosition = (newLocation: Location.LocationObject) => {
        const newPosition: Position = { latitude: newLocation.coords.latitude, longitude: newLocation.coords.longitude, timestamp: newLocation.timestamp }
        const position = positions[positions.length - 1]
        if (position) {
            const distanceIncrement = getPreciseDistance(
                { latitude: newPosition.latitude, longitude: newPosition.longitude },
                { latitude: position.latitude, longitude: position.longitude }
            );
            console.log("Ubehnuto:" + distanceIncrement)
            setTotalDistance(prevDistance => prevDistance + distanceIncrement);

            const durationIncrement = newPosition.timestamp - position.timestamp
            setTotalDuration(prevDuration => prevDuration + durationIncrement)

            // TODO: handle end of the run, save state
            if (goal &&
                ((name === "distance" && totalDistance > parseInt(goal))
                    || (name === "time" && Math.floor(totalDuration / 1000) > parseInt(goal)))) {
                console.log("Distance goal achieved")
                router.back()
            }
        }
        console.log(positions)
        console.log(newPosition)
        console.log([...positions, newPosition])
        setPositions(prevPositions => { return [...prevPositions, newPosition] })
    }

    // track location
    useEffect(() => {
        let subscriber: null | Location.LocationSubscription = null;

        const subscribe = async () => {
            // WARN: should ask before starting run
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            // TODO: change to background task - expo-task-manager
            subscriber = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 5000,
                    distanceInterval: 2
                    // activityType: Location.ActivityType.Fitness
                },
                updatePosition
            );
        };

        console.log("Subscribing to location")
        subscribe();

        return () => {
            console.log("Unsubscribing to location")
            subscriber?.remove();
        }
    }, []);

    const pos = positions.length > 0 ? positions[positions.length - 1] : undefined
    const avgSpeed = totalDistance / Math.floor(totalDuration / 1000) // m/s
    console.log("avgSpeed: " + Math.floor(totalDuration / 1000))

    // <Text>Instant Speed: {pos?.speed}</Text>
    return (
        <View className="flex-1 items-center justify-center bg-yellow-100">
            <Text>Time while running: {formattedTime}</Text>
            <Text>Location: {pos?.latitude + ", " + pos?.longitude}</Text>
            <Text>Distance: {(totalDistance / 1000).toFixed(2)} km</Text>
            <Text>Distance: {totalDistance} metres</Text>
            <Text>Speed: {avgSpeed} m/s</Text>

            <Text>Goal: ...</Text>

            <Pressable className="bg-red-300" onPress={() => router.back()}>
                <Text>End a run</Text>
            </Pressable>
        </View>
    );
}
