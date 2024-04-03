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
    dur: number,
    poss: Position[]
}

export default function Run() {
    let { goal, name, unit } = useLocalSearchParams<{ goal: string, name: string, unit: string }>()

    const startTimeRef = useRef((new Date()).getTime())

    let [curTime, setCurTime] = useState(startTimeRef.current)

    const [errorMsg, setErrorMsg] = useState<null | string>(null);
    const [total, setTotal] = useState<Total>({ dist: 0, dur: 0, poss: [] });

    // on Mount
    useEffect(() => {
        // track location
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
                    distanceInterval: 2,
                    // activityType: Location.ActivityType.Fitness
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

            const lastPos = prevTotal.poss[prevTotal.poss.length - 1]
            if (lastPos) {
                console.log("Speed: " + newLocation.coords.speed)
                const distInc = newLocation.coords.speed == 0
                    ? 0
                    : getPreciseDistance(
                        { latitude: newPos.lat, longitude: newPos.long },
                        { latitude: lastPos.lat, longitude: lastPos.long }
                    );
                const durInc = getDiffInSecs(newPos.timestamp, lastPos.timestamp)
                return {
                    dist: prevTotal.dist + distInc,
                    dur: prevTotal.dur + durInc,
                    poss: newPoss
                }
            }
            return { ...prevTotal, poss: newPoss }
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
    const formattedTime = formatTime(diffInSeconds)

    const poss = total.poss
    const pos = poss.length > 0 ? poss[poss.length - 1] : undefined
    const avgSpeed = total.dist / total.dur // NOTE: m/s

    console.log("Total: " + JSON.stringify(total))

    // TODO: better condition to call AI
    const shouldFetch = false //seconds === 5;
    const { data, error, status } = trpc.completeAi.useQuery(undefined, {
        ...noCachingOptions,
        enabled: shouldFetch
    });

    useEffect(() => {
        // TODO: handle end of the run, save state
        if (goal &&
            ((name === "distance" && total.dist > parseInt(goal))
                || (name === "time" && Math.floor(total.dur / 1000) > parseInt(goal)))) {
            console.log("Goal achieved")
            router.back()
        }
    }, [total])

    // Audio coach
    useEffect(() => {
        if (data) {
            const playAudio = async () => {
                const soundObject = await Audio.Sound.createAsync(
                    { uri: data.url },
                    { shouldPlay: true }
                );
                setSound(soundObject.sound)
            }
            playAudio()
        }
    }, [data, error])

    // <Text>"Instant Speed:" + {pos?.speed}</Text>
    return (
        <View className="flex-1 items-center justify-center bg-yellow-100">
            <Text>Time while running: {formattedTime}</Text>
            <Text>Time from sensor: {formatTime(total.dur)}</Text>
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
