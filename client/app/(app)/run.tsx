import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Button } from '~/components/ui/button';
import { Text as Text2 } from '~/components/ui/text';
import { audioSettings } from 'utils/constants';
import { formatTime, getDiffInSecs } from 'utils/datetime';
import { trpc } from 'utils/trpc';
import { useGoalStore, GoalType, useRunStore } from '~/utils/store';
import { useShallow } from 'zustand/react/shallow'


export default function Run() {
    const { value: goal, type: goalType } = useGoalStore((state) => state.goalInfo)
    const entranceTimestamps = useGoalStore((state) => state.entranceTimestamps)

    const [startTime, distance, positions] = useRunStore(
        useShallow((state) => [state.startTime, state.distance, state.positions]))
    const { clearStore, updatePosition } = useRunStore((state) => state.api)

    let [curTime, setCurTime] = useState<number | null>(null)
    const [entranceIdx, setEntranceIdx] = useState(0)

    const sendPos = trpc.tracking.sendPosition.useMutation();
    const saveRun = trpc.data.saveRun.useMutation();
    const trpcUtils = trpc.useUtils()

    // on Mount
    useEffect(() => {
        clearStore()
        // track location
        const locationSubscriber = startTrackingLocation((newLocation: Location.LocationObject) => {
            const { newPos, distInc } = updatePosition(newLocation)
            sendPos.mutateAsync({ ...newPos, distInc })
        })
        // track time
        const interval = setInterval(() => setCurTime((new Date()).getTime()), 1000);

        // on Unmount
        return () => {
            clearInterval(interval);
            locationSubscriber?.remove();
        }
    }, []);

    const [sound, setSound] = useState<Sound | null>(null)
    useEffect(() => {
        Audio.setAudioModeAsync(audioSettings);
        return sound
            ? () => { sound.unloadAsync(); }
            : undefined;
    }, [sound]);

    const diffInSeconds = getDiffInSecs(curTime, startTime)
    const formattedTime = formatTime(diffInSeconds)

    const pos = positions.length > 0 ? positions[positions.length - 1] : undefined
    const avgSpeed = distance / diffInSeconds // m/s

    // TODO: handle end of the run, save state
    const onRunEnd = async () => {
        console.log(goalType, "goal achieved")
        await saveRun.mutateAsync({
            distance: distance,
            time: formattedTime
        })
        trpcUtils.data.getRunHistory.invalidate()
        router.replace('detail')
    }

    if (goalType === GoalType.Duration) {
        useEffect(() => {
            console.log(diffInSeconds)
            console.log(goal * 60)
            if (diffInSeconds >= goal * 60) {
                onRunEnd()
            }

            if (diffInSeconds >= entranceTimestamps[entranceIdx] * 60.0) {
                console.log("Refetching duration: ", diffInSeconds)
                setEntranceIdx((prev) => prev + 1)
            }
        }, [curTime])
    } else if (goalType === GoalType.Distance) {
        useEffect(() => {
            if (distance >= goal) {
                onRunEnd()
            }

            if (distance >= entranceTimestamps[entranceIdx]) {
                console.log("Refetching distance: ", distance)
                setEntranceIdx((idx) => idx + 1)
            }
        }, [distance])
    }

    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    useEffect(() => {
        if (entranceIdx > 0) {
            const fetchAudio = async () => {
                // HACK: replace fetch with useQuery
                const data = await trpcUtils.naration.getNext.fetch({
                    idx: entranceIdx,
                    runDuration: formattedTime
                })
                setAudioUrl(data)
            }
            fetchAudio()
        }
    }, [entranceIdx])

    const { data: firstAudioUrl } = trpc.naration.getFirst.useQuery(undefined, {
        staleTime: Infinity,
        retry: 20,
        retryDelay: failureCount => failureCount < 3 ? 5000 : 1000
    });

    // Audio coach
    useEffect(() => {
        const url = audioUrl || firstAudioUrl
        if (url) {
            const playAudio = async () => {
                const soundObject = await Audio.Sound.createAsync(
                    { uri: url },
                    { shouldPlay: true }
                );
                setSound(soundObject.sound)
            }
            playAudio()
        }
    }, [audioUrl, firstAudioUrl])

    // <Text>"Instant Speed:" + {pos?.speed}</Text>
    return (
        <View className="flex-1 items-center justify-center">
            <View className='items-center'>
                <Text>Time</Text>
                <Text className='text-8xl'>{formattedTime}</Text>
            </View>
            <Text>Location: {pos?.lat + ", " + pos?.long}</Text>
            <Text>Distance: {(distance / 1000).toFixed(2)} km</Text>
            <Text>Distance: {distance} metres</Text>
            <Text>Speed: {avgSpeed} m/s</Text>

            <Text>Goal: {goal}</Text>

            <Button onPress={() => router.back()}>
                <Text2>End a run</Text2>
            </Button>
        </View>
    );
}

function startTrackingLocation(updatePosition: (newLocation: Location.LocationObject) => void): null | Location.LocationSubscription {
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
    return subscriber
}

