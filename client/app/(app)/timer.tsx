
import React, { useEffect, useRef, useState } from 'react'
import { getDiffInSecs } from 'utils/conversions'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Text } from '~/components/ui/text'

const TIMER_INTERVAL = 4

export default function Timer() {
    const startTimeRef = useRef((new Date()).getTime())
    let [curTime, setCurTime] = useState(startTimeRef.current)

    const diffInSeconds = getDiffInSecs(curTime, startTimeRef.current)

    useEffect(() => {
        const interval = setInterval(() => setCurTime((new Date()).getTime()), 300);
        return () => { clearInterval(interval); }
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

