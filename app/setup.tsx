import { router } from 'expo-router';
import { View, Pressable, Text } from 'react-native';

export default function Setup() {
    return (
        <View className="flex items-center justify-center">
            <Text>Settings.......</Text>
            <Pressable onPress={() => router.navigate("/run")}>
                <Text>Start a run</Text>
            </Pressable>
        </View>
    );
}
