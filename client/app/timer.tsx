
import React, { useEffect, useRef, useState } from 'react'
import { getDiffInSecs } from '../utils/datetime'
import { router, useLocalSearchParams } from 'expo-router'
import { View, Text } from 'react-native'

const TIMER_INTERVAL = 10

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
        <View className='justify-center items-center'>
            <Text className='text-2xl font-bold'>{TIMER_INTERVAL - diffInSeconds}</Text>
        </View>
    )
}

