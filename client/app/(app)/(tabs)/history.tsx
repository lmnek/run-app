
import { router } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { Text } from '~/components/ui/text';
import { formatMetresInKm, formatSecsToMinutes, formatSpeed, timestampToDate } from '~/utils/conversions';
import { useRunDetailStore } from '~/utils/stores/runDetailsStore';
import { trpc } from '~/utils/trpc';

export default function History() {
    const { data: runs } = trpc.db.getRunsHistory.useQuery()
    const setDetails = useRunDetailStore(state => state.setAll)

    if (!runs) {
        return <Text className='text-center pt-8 text-2xl'>Loading...</Text>
    } else if (runs.length === 0) {
        return <Text className='text-center pt-8 text-2xl'>No runs yet!</Text>
    }
    type Run = typeof runs[0]

    const onSelect = async (run: Run) => {
        const details = {
            ...run,
            topic: run.topic ? run.topic : undefined,
            intent: run.intent ? run.intent : undefined,
            positions: undefined
        }
        setDetails(details)
        router.push('/detail')
    }

    const renderItem = ({ item: run }: { item: Run }) => {
        return <Pressable
            key={run.id}
            className='mx-12 mb-12 py-6 px-8 rounded-xl \
                bg-muted shadow shadow-black'
            onPress={() => onSelect(run)}
        >
            <View className='flex flex-row justify-between pb-4'>
                <Text className=''>Run #{run.serial}</Text>
                <Text>{timestampToDate(run.startTime)}</Text>
            </View>
            <View className='flex flex-row gap-x-6'>
                <Text className='font-bold text-xl'>{formatSecsToMinutes(run.duration)}</Text>
                <View className='flex-row items-end'>
                    <Text className='font-bold text-xl'>{formatMetresInKm(run.distance)}</Text>
                    <Text> km</Text>
                </View>
                <View className='flex-row items-end'>
                    <Text className='font-bold text-xl'>{formatSpeed(run.speed)}</Text>
                    <Text> min/km</Text>
                </View>
            </View>
        </Pressable>
    }

    return (
        <FlatList
            className='py-8'
            data={runs}
            renderItem={renderItem}
        />
    );
}
