import { View } from 'react-native';
import Map from '~/components/Map';
import { formatMetresInKm, formatSecsToMinutes, formatSpeed, timestampToDate, timestampToTime } from '~/utils/conversions';
import { useRunDetailStore } from '~/utils/stores/runDetailsStore';
import { useRunStore } from '~/utils/stores/runStore';
import { trpc } from '~/utils/trpc';
import { Text } from '~/components/ui/text';
import { useEffect } from 'react';
import { skipToken } from '@tanstack/react-query';
import { Separator } from '~/components/ui/separator';

export default function Detail() {
    const { id, serial, distance, duration, startTime, speed, topic, intent } = useRunDetailStore()

    const preloadedPositions = useRunStore(state => state.positions)
    const clearRunStore = useRunStore(state => state.api.clearStore)

    const { data: poss } = trpc.db.getRunPositions.useQuery(id ? id : skipToken)
    const positions = id ? poss : preloadedPositions

    const themeStr = ''
        + (intent ? intent : '')
        + ((intent && topic) ? ' - ' : '')
        + (topic ? topic : '')

    // on Unmount
    useEffect(() => {
        return () => clearRunStore()
    }, [])

    return (
        <View className='flex-1 m-10'>
            <View className='flex-1'>
                <View className='pb-4'>
                    <Text className='font-bold text-2xl pb-2'>Run {serial ? '#' + serial : 'finished!'}</Text>
                    {
                        (intent || topic) &&
                        <Text className='font-bold text-2xl pb-4'>{themeStr}</Text>
                    }
                    <Text className='text-muted-foreground'>{timestampToDate(startTime)}</Text>
                    <Text className='text-muted-foreground'>{timestampToTime(startTime)}</Text>
                </View>
                <Separator />
                <View className='flex justify-center'>
                    <View className='flex flex-row items-center justify-center pt-16'>
                        <View className='items-center'>
                            <Text className='text-4xl font-bold'>{formatSecsToMinutes(duration!)}</Text>
                            <Text>Duration</Text>
                        </View>
                        <View className='items-center px-8'>
                            <Text className='text-4xl font-bold'>{formatMetresInKm(distance)}</Text>
                            <Text>Distance</Text>
                        </View>
                        <View className='items-center'>
                            <Text className='text-4xl font-bold'>{formatSpeed(speed)}</Text>
                            <Text>Pace</Text>
                        </View>
                    </View>
                </View>
            </View>
            <Text className='text-xl font-bold mb-2'>Run Route</Text>
            <View className='flex-1 items-center justify-center'>
                <Map positions={positions} />
            </View>
        </View>

    );
}

