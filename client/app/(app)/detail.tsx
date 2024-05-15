import { Alert, View } from 'react-native';
import Map from '~/components/Map';
import { calculateCaloriesBurned, formatMetresInKm, formatSecsToMinutes, formatSpeed, timestampToDate, timestampToTime } from '~/utils/conversions';
import { useRunDetailStore } from '~/utils/stores/runDetailsStore';
import { useRunStore } from '~/utils/stores/runStore';
import { trpc } from '~/utils/trpc';
import { Text } from '~/components/ui/text';
import { useEffect } from 'react';
import { skipToken } from '@tanstack/react-query';
import { Separator } from '~/components/ui/separator';
import { Button } from '~/components/ui/button';
import { Ellipsis } from '~/components/Icons';

// Screen with a single run details and a map 
// It is shown after finishing a run 
// or when clicked on run in running history
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
                <Separator className='bg-primary' />
                <View className='flex-1 flex-row justify-between items-center pb-4 px-1'>
                    <View className='items-center'>
                        <Text className='text-4xl font-bold'>{formatSecsToMinutes(duration!)}</Text>
                        <Text>Duration</Text>
                    </View>
                    <View className='items-center'>
                        <Text className='text-4xl font-bold'>{formatMetresInKm(distance)}</Text>
                        <Text>Distance</Text>
                    </View>
                    <View className='items-center'>
                        <Text className='text-4xl font-bold'>{formatSpeed(speed)}</Text>
                        <Text>Pace</Text>
                    </View>
                    <View className='items-center'>
                        <Text className='text-4xl font-bold'>{calculateCaloriesBurned(distance).toFixed(0)}</Text>
                        <Text>Calories</Text>
                    </View>
                </View>
            </View>
            <Text className='text-xl font-bold mb-2'>Run Route</Text>
            <View className='flex-1 items-center justify-center shadow'>
                <Map positions={positions} />
            </View>
        </View>

    );
}

// Button in top right status bar to interact with the run
export function DetailMoreButton({ deleteRun }
    : { deleteRun: () => void }) {
    return <Button
        variant='ghost'
        size='icon'
        onPress={() => {
            Alert.alert('Action', undefined, [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Edit name / Share',
                    onPress: () => {
                        // TODO: ...
                        Alert.alert('Not yet implemented')
                    }
                },
                {
                    text: 'Delete run',
                    onPress: deleteRun,
                    style: 'destructive'
                }
            ], { cancelable: true })
        }}
    >
        <Ellipsis size={25} strokeWidth={2} color='#000000' />
    </Button>
}
