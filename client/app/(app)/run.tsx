import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Button } from '~/components/ui/button';
import { Text as Text2 } from '~/components/ui/text';
import { audioSettings } from 'utils/constants';
import { formatMetresInKm, formatSecsToMinutes, formatSpeed, getDiffInSecs } from 'utils/conversions';
import { trpc } from 'utils/trpc';
import { useShallow } from 'zustand/react/shallow'
import { GoalType, useGoalStore } from '~/utils/stores/goalStore';
import { useRunStore } from '~/utils/stores/runStore';
import { useRunDetailStore } from '~/utils/stores/runDetailsStore';


export default function Run() {
    const { value: goal, type: goalType, unit } = useGoalStore((state) => state.goalInfo)
    const entranceTimestamps = useGoalStore((state) => state.entranceTimestamps)
    const [topic, intent] = useGoalStore(useShallow((state) => [state.topic, state.intent]))

    const [startTime, distance, positions] = useRunStore(
        useShallow((state) => [state.startTime, state.distance, state.positions, state.endTime]))
    const { clearStore, updatePosition, setEndTime, setStartTime } = useRunStore((state) => state.api)
    const setAll = useRunDetailStore(state => state.setAll)

    let [curTime, setCurTime] = useState<number | null>(null)
    const [entranceIdx, setEntranceIdx] = useState(0)

    const sendPos = trpc.tracking.sendPosition.useMutation();
    const saveRun = trpc.db.saveRun.useMutation();
    const trpcUtils = trpc.useUtils()

    // on Mount
    useEffect(() => {
        clearStore()
        setStartTime()

        const startTracking = async () => {
            // TODO: change to background task - expo-task-manager
            return await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 5000,
                    distanceInterval: 2,
                },
                (newLocation: Location.LocationObject) => {
                    const { newPos, distInc } = updatePosition(newLocation)
                    const savedPos = { ...newPos, distInc }
                    sendPos.mutateAsync(savedPos)
                        .catch((err) =>
                            console.log('Send Pos error: ', JSON.stringify(err)))
                }
            )
        }
        const subscriber = startTracking()
        // track time
        const interval = setInterval(() => setCurTime((new Date()).getTime()), 1000)

        // on Unmount
        return () => {
            trpcUtils.naration.getFirst.invalidate()
            clearInterval(interval)
            subscriber?.then((s) => s.remove())
        }
    }, []);

    const [sound, setSound] = useState<Sound | null>(null)
    useEffect(() => {
        Audio.setAudioModeAsync(audioSettings);

        // TODO: dont turn off when run ends
        return sound
            ? () => { sound.unloadAsync(); }
            : undefined;
    }, [sound]);

    const diffInSeconds = getDiffInSecs(curTime, startTime)
    const formattedTime = formatSecsToMinutes(diffInSeconds)

    const pos = positions.length > 0 ? positions[positions.length - 1] : undefined
    const avgSpeed = distance / diffInSeconds // m/s

    const onRunEnd = async () => {
        console.log(goalType, "goal achieved")
        const endTime = setEndTime()
        const data = {
            duration: diffInSeconds,
            startTime: startTime!,
            speed: avgSpeed,
            serial: undefined, id: undefined,
            distance, endTime, topic, intent
        }
        setAll(data)

        saveRun.mutateAsync(data)
            .then(() => {
                trpcUtils.db.getRunsHistory.invalidate()
                trpcUtils.db.getRunsHistory.prefetch()
            })
        router.replace('detail')
    }

    if (goalType === GoalType.Duration) {
        useEffect(() => {
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

    const playAudio = async (url: string | null | undefined) => {
        if (url) {
            const soundObject = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true }
            );
            setSound(soundObject.sound)
        }
    }

    const { data: firstAudioUrl } = trpc.naration.getFirst.useQuery(undefined, {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        retry: 30,
        retryDelay: failureCount => failureCount < 3 ? 5000 : 1000
    });
    useEffect(() => { playAudio(firstAudioUrl) }, [firstAudioUrl])

    const { data: audioUrl } = trpc.naration.getNext.useQuery({
        idx: entranceIdx,
        runDuration: formattedTime
    }, {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        queryKeyHashFn: () => entranceIdx.toString(),
        enabled: entranceIdx > 0
    })
    useEffect(() => { playAudio(audioUrl) }, [audioUrl])

    return (
        <View className="flex-1 items-center justify-center">
            <View className='items-center'>
                <Text>Time</Text>
                <Text className='text-8xl'>{formattedTime}</Text>
            </View>
            <Text>Location: {pos?.lat + ", " + pos?.long}</Text>
            <Text>Distance: {formatMetresInKm(distance)} km</Text>
            <Text>Distance: {distance} metres</Text>
            <Text>Instant speed: {pos?.instantSpeed}</Text>
            <Text>Speed: {formatSpeed(avgSpeed)} min/km</Text>

            <Text>Goal: {goal} {unit}</Text>

            <Button onPress={() => router.back()}>
                <Text2>End a run</Text2>
            </Button>
        </View>
    );
}
