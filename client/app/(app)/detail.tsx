import { skipToken } from '@tanstack/react-query';
import { View } from 'react-native';
import Map from '~/components/Map';
import { formatTime } from '~/utils/datetime';
import { useRunDetailStore } from '~/utils/store';
import { trpc } from '~/utils/trpc';
import { Text } from '~/components/ui/text';

export default function Detail() {
    const { id, serial, distance, duration, startTime, speed, positions: preloadedPositions, topic, intent } = useRunDetailStore()
    const formatedStartTime = (new Date(startTime!)).toLocaleString()
    const formatedDuration = formatTime(duration!)

    const { data: poss } = trpc.db.getRunPositions.useQuery(id ? id : skipToken)
    const positions = preloadedPositions || poss

    return (
        <View className='flex-1 m-10'>
            <View className='flex-1 items-center gap-y-3'>
                <Text className='text-center font-bold text-2xl py-4'>Run {serial ? '#' + serial : 'finished!'}</Text>
                {
                    (intent || topic) &&
                    <Text>Theme: {intent ? intent : ''}{topic ? ' - ' + topic : ''}</Text>
                }
                <Text>Start: {formatedStartTime}</Text>
                <Text>Distance: {distance} m</Text>
                <Text>Duration: {formatedDuration}</Text>
                <Text>Speed: {speed} m/s</Text>
            </View>
            <Text className='text-xl font-bold mb-2'>Run Route</Text>
            <View className='flex-1 items-center justify-center'>
                <Map positions={positions} />
            </View>
        </View>

    );
}

