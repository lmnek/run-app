import { View } from 'react-native';
import Map from '~/components/Map';
import { formatSecsToMinutes, formatSpeed, timestampToDate, timestampToTime } from '~/utils/conversions';
import { useRunDetailStore } from '~/utils/stores/runDetailsStore';
import { useRunStore } from '~/utils/stores/runStore';
import { trpc } from '~/utils/trpc';
import { Text } from '~/components/ui/text';
import { useEffect } from 'react';

export default function Detail() {
    const { id, serial, distance, duration, startTime, speed, topic, intent } = useRunDetailStore()

    const preloadedPositions = useRunStore(state => state.positions)
    const clearRunStore = useRunStore(state => state.api.clearStore)

    const { data: poss } = trpc.db.getRunPositions.useQuery(id, {
        enabled: id !== undefined
    })
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
            <View className='flex-1 items-center gap-y-3'>
                <Text className='text-center font-bold text-2xl py-4'>Run {serial ? '#' + serial : 'finished!'}</Text>
                {
                    (intent || topic) &&
                    <Text>Theme: {themeStr}</Text>
                }
                <Text>Start: {timestampToDate(startTime)}, {timestampToTime(startTime)}</Text>
                <Text>Distance: {distance} m</Text>
                <Text>Duration: {formatSecsToMinutes(duration!)}</Text>
                <Text>Speed: {formatSpeed(speed)} min/km</Text>
            </View>
            <Text className='text-xl font-bold mb-2'>Run Route</Text>
            <View className='flex-1 items-center justify-center'>
                <Map positions={positions} />
            </View>
        </View>

    );
}

