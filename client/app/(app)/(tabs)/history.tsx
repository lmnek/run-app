
import { router } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { Text } from '~/components/ui/text';
import { formatTime } from '~/utils/datetime';
import { useRunDetailStore } from '~/utils/store';
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
            className='mx-4 mb-8 p-4 rounded-xl border-green border-solid border bg-gray-100 active:bg-orange-200'
            onPress={() => onSelect(run)}
        >
            <View className='flex flex-row justify-between'>
                <Text className='font-bold'>Run #{run.serial}</Text>
                <Text>{new Date(run.startTime).toLocaleString()}</Text>
            </View>
            <Text>Duration {formatTime(run.duration)}</Text>
            <Text>Distance {run.distance} m</Text>
        </Pressable>
    }

    return (
        < FlatList
            className='py-4'
            data={runs}
            renderItem={renderItem}
        />
    );
}
