import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { getPreciseDistance } from 'geolib';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { audioSettings } from '../utils/constants';
import { formatTime, getDiffInSecs } from '../utils/datetime';
import { noCachingOptions, trpc } from '../utils/trpc';

type Position = {
    lat: number,
    long: number,
    timestamp: number
}

type Total = {
    dist: number, // metres
    poss: Position[]
}

export default function Run() {
    let { goal, name: goalName, unit } = useLocalSearchParams<{ goal: string, name: string, unit: string }>()

    const startTimeRef = useRef((new Date()).getTime())

    let [curTime, setCurTime] = useState(startTimeRef.current)

    const [total, setTotal] = useState<Total>({ dist: 0, poss: [] });

    const sendPos = trpc.sendPosition.useMutation();

    // on Mount
    useEffect(() => {
        // track location
        let subscriber: null | Location.LocationSubscription = null;
        const subscribe = async () => {

            // TODO: change to background task - expo-task-manager
            subscriber = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 5000,
                    distanceInterval: 2,
                },
                updatePosition
            );
        };
        subscribe();

        // track time
        const interval = setInterval(() => setCurTime((new Date()).getTime()), 1000);

        return () => {
            clearInterval(interval);
            subscriber?.remove();
        }
    }, []);

    // Location updates from device
    const updatePosition = (newLocation: Location.LocationObject) => {
        setTotal((prevTotal) => {
            const newPos = {
                lat: newLocation.coords.latitude, long: newLocation.coords.longitude,
                timestamp: newLocation.timestamp
            }
            const newPoss = [...prevTotal.poss, newPos]
            let newDist = prevTotal.dist

            const lastPos = prevTotal.poss[prevTotal.poss.length - 1]
            if (lastPos) {
                console.log("Speed: " + newLocation.coords.speed)
                const distInc = newLocation.coords.speed == 0
                    ? 0
                    : getPreciseDistance(
                        { latitude: newPos.lat, longitude: newPos.long },
                        { latitude: lastPos.lat, longitude: lastPos.long }
                    );
                newDist += distInc
            }

            sendPos.mutateAsync(newPos) // send to server
            return { dist: newDist, poss: newPoss }
        })
    }

    const [sound, setSound] = useState<Sound | null>(null)
    useEffect(() => {
        Audio.setAudioModeAsync(audioSettings);
        return sound
            ? () => { sound.unloadAsync(); }
            : undefined;
    }, [sound]);

    const diffInSeconds = getDiffInSecs(curTime, startTimeRef.current)
    if (goalName === "time" && Math.floor(diffInSeconds / 60) >= parseInt(goal!)) {
        console.log("Time goal achieved")
        router.back()
    }

    const formattedTime = formatTime(diffInSeconds)

    const pos = total.poss.length > 0 ? total.poss[total.poss.length - 1] : undefined
    const avgSpeed = total.dist / diffInSeconds // NOTE: m/s

    // console.log("Total: " + JSON.stringify(total))

    const { data: firstData } = trpc.getFirstNaration.useQuery(undefined, {
        staleTime: Infinity,
        retry: 15,
        retryDelay: failureCount => failureCount < 3 ? 10000 : 1000
    });

    // TODO: better condition to call AI
    const shouldFetch = diffInSeconds === 120 // (diffInSeconds % 60) === 5;
    const { data, error, status } = trpc.getNaration.useQuery(undefined, {
        ...noCachingOptions,
        enabled: shouldFetch
    });

    useEffect(() => {
        // TODO: handle end of the run, save state
        if (goalName === "distance" && total.dist >= parseInt(goal!)) {
            console.log("Distance goal achieved")
            router.back()
        }
    }, [total])

    // Audio coach
    useEffect(() => {
        const playData = data || firstData
        if (playData) {
            const playAudio = async () => {
                const soundObject = await Audio.Sound.createAsync(
                    { uri: playData.url },
                    { shouldPlay: true }
                );
                setSound(soundObject.sound)
            }
            playAudio()
        }
    }, [data, firstData])

    // <Text>"Instant Speed:" + {pos?.speed}</Text>
    return (
        <View className="flex-1 items-center justify-center bg-yellow-100">
            <Text>Time while running: {formattedTime}</Text>
            <Text>Location: {pos?.lat + ", " + pos?.long}</Text>
            <Text>Distance: {(total.dist / 1000).toFixed(2)} km</Text>
            <Text>Distance: {total.dist} metres</Text>
            <Text>Speed: {avgSpeed} m/s</Text>

            <Text>Goal: ...</Text>

            <Pressable className="bg-red-300" onPress={() => router.back()}>
                <Text>End a run</Text>
            </Pressable>
        </View>
    );
}
