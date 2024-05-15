import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { DimensionValue, View } from 'react-native';
import { Text } from '~/components/ui/text';
import { audioSettings } from 'utils/constants';
import { calculateCaloriesBurned, formatMetresInKm, formatSecsToMinutes, formatSpeed, getDiffInSecs } from 'utils/conversions';
import { trpc } from 'utils/trpc';
import { useShallow } from 'zustand/react/shallow'
import { GoalType, useGoalStore } from '~/utils/stores/goalStore';
import { useRunStore } from '~/utils/stores/runStore';
import { useRunDetailStore } from '~/utils/stores/runDetailsStore';
import { logger } from '~/utils/logger';

// The main screen and logic while user is running
export default function Run() {
    const { value: goal, type: goalType, unit } = useGoalStore((state) => state.goalInfo)
    const entranceTimestamps = useGoalStore((state) => state.entranceTimestamps)
    const [topic, intent] = useGoalStore(useShallow((state) => [state.topic, state.intent]))

    const [startTime, distance, positions] = useRunStore(
        useShallow((state) => [state.startTime, state.distance, state.positions, state.endTime]))
    const { clearStore, setEndTime, setStartTime } = useRunStore((state) => state.api)
    const setAll = useRunDetailStore(state => state.setAll)

    let [curTime, setCurTime] = useState<number | null>(null)
    let [percent, setPercent] = useState<number>(0)
    const [entranceIdx, setEntranceIdx] = useState(0)

    const saveRun = trpc.db.saveRun.useMutation();
    const trpcUtils = trpc.useUtils()

    // on Mount 
    useEffect(() => {
        clearStore()
        setStartTime()

        // Start tracking time
        const interval = setInterval(() => setCurTime((new Date()).getTime()), 400)

        // on Unmount
        return () => {
            setEndTime()
            clearInterval(interval)
        }
    }, [])

    const [sound, setSound] = useState<Sound | null>(null)
    const finishedRun = useRef(false)
    // Play a sound in the background when it is set
    useEffect(() => {
        Audio.setAudioModeAsync(audioSettings);
        return sound
            ? () => {
                if (!finishedRun) {
                    sound.unloadAsync()
                }
            }
            : undefined;
    }, [sound]);

    // Set sound state
    const playAudio = async (url: string | null | undefined) => {
        if (url) {
            const soundObject = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true }
            );
            setSound(soundObject.sound)
        }
    }
    const diffInSeconds = getDiffInSecs(curTime, startTime)
    const formattedTime = formatSecsToMinutes(diffInSeconds)

    const pos = positions.length > 0 ? positions[positions.length - 1] : undefined
    const avgSpeed = distance / diffInSeconds // m/s

    const onRunEnd = async () => {
        logger.info(goal + ' ' + goalType + ' goal achieved')
        finishedRun.current = true
        const endTime = setEndTime()
        const data = {
            duration: diffInSeconds,
            startTime: startTime!,
            speed: avgSpeed,
            serial: undefined, id: undefined,
            distance, endTime, topic, intent
        }
        setAll(data)

        // Save run in DB
        saveRun.mutateAsync(data)
            .then(() => {
                trpcUtils.db.getRunsHistory.invalidate()
                trpcUtils.db.getRunsHistory.prefetch()
            })
        router.replace('detail')
    }

    // Check if goal was achieved
    // or if coaching audio should be fetched
    if (goalType === GoalType.Duration) {
        useEffect(() => {
            setPercent(diffInSeconds / ((goal * 60) / 100))
            if (diffInSeconds >= goal * 60) {
                onRunEnd()
            }

            if (diffInSeconds >= entranceTimestamps[entranceIdx] * 60.0) {
                logger.info('Refetching duration: ' + diffInSeconds)
                setEntranceIdx((prev) => prev + 1)
            }
        }, [curTime])
    } else if (goalType === GoalType.Distance) {
        useEffect(() => {
            setPercent(distance / (goal / 100))
            if (distance >= goal) {
                onRunEnd()
            }

            if (distance >= entranceTimestamps[entranceIdx]) {
                logger.info('Refetching distance: ' + distance)
                setEntranceIdx((idx) => idx + 1)
            }
        }, [distance])
    }

    // Fetch the first audio narration 
    // repeatedly until it is ready
    // (Only once at the start of the run)
    const { data: firstAudioUrl } = trpc.narration.getFirst.useQuery(undefined, {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        retry: 30,
        retryDelay: (failureCount) => failureCount < 3 ? 3000 : 1000
    });
    useEffect(() => { playAudio(firstAudioUrl) }, [firstAudioUrl])

    // Fetch the narration when a timestamp/distance is crossed
    const { data: audioUrl } = trpc.narration.getNext.useQuery({
        idx: entranceIdx,
        runDuration: formattedTime
    }, {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        // Fetches only when entrance index changes
        queryKeyHashFn: () => entranceIdx.toString(),
        enabled: entranceIdx > 0
    })
    useEffect(() => { playAudio(audioUrl) }, [audioUrl])


    return (
        <View className="flex-1 w-full p-12 pt-16 gap-y-7 items-center">
            <View className='items-center'>
                <Text className='text-xl pb-4'>Time</Text>
                <Text className='text-8xl font-bold'>{formattedTime}</Text>
            </View>
            <ProgressBar percentage={percent} />
            <View className='items-center'>
                <Text className='text-4xl font-bold'>{formatMetresInKm(distance)}</Text>
                <Text>Distance (km)</Text>
            </View>
            <View className='items-center'>
                <Text className='text-4xl font-bold'>{formatSpeed(avgSpeed)}</Text>
                <Text>Pace</Text>
            </View>
            <View className='items-center'>
                <Text className='text-4xl font-bold'>{pos ? formatSpeed(pos.instantSpeed) : '0.00'}</Text>
                <Text>Instant pace</Text>
            </View>
            <View className='items-center'>
                <Text className='text-4xl font-bold'>{calculateCaloriesBurned(distance).toFixed(2)}</Text>
                <Text className='pb-2'>Calories burned</Text>
            </View>
            {
                // NOTE: Only for testing
                false &&
                <View>
                    <Text>Goal: {goal} {unit}</Text>
                    <Text>Instant speed: {pos?.instantSpeed}</Text>
                    <Text>Location: {pos?.lat + ", " + pos?.long}</Text>
                    <Text>Distance: {distance} metres</Text>
                    <Text>Percent finished: {percent}%</Text>
                </View>
            }
        </View>
    );
}

function ProgressBar({ percentage }: { percentage: number }) {
    return <View className='mb-8 w-full h-2 rounded bg-muted'>
        <View
            className='h-2 bg-primary'
            style={{ width: (percentage + '%') as DimensionValue }}
        />
    </View>
}
