import { View, Pressable, Text } from 'react-native';

export default function Run() {
    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text>Left to run: 23:21</Text>
            <Pressable>
                <Text>End a run</Text>
            </Pressable>
        </View>
    );
}
