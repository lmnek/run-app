
import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function Page() {
    return (
        <Pressable className="flex-1 items-center justify-center"
            onPress={() => router.navigate("/setup")}>
            <Text>Start a run</Text>
        </Pressable>
    );
}
