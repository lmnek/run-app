
import React, { useEffect, useRef, useState } from 'react'
import { getDiffInSecs } from '../utils/datetime'
import { router, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { Text } from '~/components/ui/text'

const TIMER_INTERVAL = 4

export default function Timer() {
    let params = useLocalSearchParams()

    const startTimeRef = useRef((new Date()).getTime())
    let [curTime, setCurTime] = useState(startTimeRef.current)

    const diffInSeconds = getDiffInSecs(curTime, startTimeRef.current)

    useEffect(() => {
        const interval = setInterval(() => setCurTime((new Date()).getTime()), 1000);
        return () => { clearInterval(interval); }
    }, [])

    useEffect(() => {
        if (diffInSeconds >= TIMER_INTERVAL) {
            router.replace({
                pathname: "/run",
                params: params
            })
        }
    }, [curTime])

    return (
        <View className='flex-1 justify-center items-center'>
            <Text className='text-8xl font-bold'>{TIMER_INTERVAL - diffInSeconds}</Text>
        </View>
    )
}

