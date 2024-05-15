
import { router } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { Text } from '~/components/ui/text';
import { formatMetresInKm, formatSecsToMinutes, formatSpeed, timestampToDate } from '~/utils/conversions';
import { useRunDetailStore } from '~/utils/stores/runDetailsStore';
import { trpc } from '~/utils/trpc';

// The screen showing all of the previous runs
export default function History() {
    // Fetch the runs from the DB
    const { data: runs } = trpc.db.getRunsHistory.useQuery()
    const setDetails = useRunDetailStore(state => state.setAll)

    if (!runs) {
        // Show placeholder when loading
        return <Text className='text-center pt-8 text-2xl'>Loading...</Text>
    } else if (runs.length === 0) {
        return <Text className='text-center pt-8 text-2xl'>No runs yet!</Text>
    }
    type Run = typeof runs[0]

    // Fetch the given run detail data
    // and open the detail run screen
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

    // A component for the single run button
    const renderItem = ({ item: run }: { item: Run }) => {
        return <Pressable
            key={run.id}
            className='mx-12 mb-12 py-6 px-8 rounded-xl \
                bg-muted shadow'
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

    // Render all runs in scrollable list
    return (
        <FlatList
            className='py-8'
            data={runs}
            renderItem={renderItem}
        />
    );
}
