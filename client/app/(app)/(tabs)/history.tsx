
import { FlatList, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { trpc } from '~/utils/trpc';

export default function Page() {

    const { data: runs } = trpc.data.getRunHistory.useQuery()

    if (!runs) {
        return <Text>Loading...</Text>
    }
    type runType = typeof runs[0]

    const renderItem = ({ item: run }: { item: runType }) => {
        return <Pressable
            key={run.id}
            className='m-4 p-4 bg-gray-200 rounded-xl border-green border-solid border-2'
        >
            <Text>Run #{run.serial}</Text>
            <Text>Time {run.time}</Text>
        </Pressable>
    }

    return (
        <FlatList
            className='pt-4'
            data={runs}
            renderItem={renderItem}
        />
    );
}
