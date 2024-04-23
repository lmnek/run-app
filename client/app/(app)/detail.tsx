
import { Text, View } from 'react-native';
import { useRunStore } from '~/utils/store';

export default function Page() {
    const distance = useRunStore(state => state.distance)
    const startTime = useRunStore(state => state.startTime)!

    const formated = (new Date(startTime)).toLocaleString()

    return (
        <View>
            <Text>Run completed: </Text>
            <Text>Start: {formated}</Text>
            <Text>Distance: {distance}</Text>
        </View>
    );
}
