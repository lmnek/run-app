
import React, { useEffect, useRef, useState } from 'react'
import { getDiffInSecs } from 'utils/conversions'
import { router } from 'expo-router'
import * as Location from 'expo-location';
import { trpc } from '~/utils/trpc'
import { logger } from '~/utils/logger'
import { useRunStore } from '~/utils/stores/runStore'
import { locationTrackingSettings } from '~/utils/constants';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';

const TIMER_INTERVAL = 4

// Countdown before the run starts
export default function Timer() {
    const startTimeRef = useRef((new Date()).getTime())
    let [curTime, setCurTime] = useState(startTimeRef.current)

    const diffInSeconds = getDiffInSecs(curTime, startTimeRef.current)

    const sendPos = trpc.tracking.sendPosition.useMutation();
    const trpcUtils = trpc.useUtils()
    const { updatePosition, clearStore, setSubscriber } = useRunStore((state) => state.api)

    useEffect(() => {
        const interval = setInterval(() => setCurTime((new Date()).getTime()), 300);
        return () => { clearInterval(interval); }
    }, [])

    // Start tracking location now 
    // so there is no delay when the run starts
    useEffect(() => {
        clearStore()
        trpcUtils.narration.getFirst.invalidate()
        const startTracking = async () => {
            // TODO: change to background task - expo-task-manager
            return await Location.watchPositionAsync(
                locationTrackingSettings,
                (newLocation: Location.LocationObject) => {
                    const updated = updatePosition(newLocation)
                    if (updated) {
                        sendPos.mutateAsync({
                            ...updated.newPos,
                            distInc: updated.distInc
                        }).catch((err) => logger.warn('Send pos failed: '
                            + JSON.stringify(updated) + JSON.stringify(err)))
                    }
                }
            )
        }
        startTracking()
            .then((s) => setSubscriber(s))
    }, [])

    useEffect(() => {
        if (diffInSeconds >= TIMER_INTERVAL) {
            router.replace("/run")
        }
    }, [curTime])

    return (
        <View className='flex-1 justify-center items-center pb-8'>
            <Text className='text-8xl font-bold'>{TIMER_INTERVAL - diffInSeconds}</Text>
        </View>
    )
}

