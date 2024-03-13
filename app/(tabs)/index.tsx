import { router } from 'expo-router';
import { useState } from 'react';
import { View, Pressable, Text, TextInput } from 'react-native';

export default function Setup() {
    let [goal, setGoal] = useState("10")
    let [goalType, setGoalType] = useState({ name: "time", unit: "min" })

    return (
        <View className="flex items-center justify-center space-y-5 pt-4">
            <View className="flex-row space-x-2">
                <Pressable
                    className={goalType.name === "time" ? "bg-red-200" : ""}
                    onPress={() => setGoalType({ name: "time", unit: "min" })}>
                    <Text>Time</Text>
                </Pressable>
                <Pressable
                    className={goalType.name === "distance" ? "bg-red-200" : ""}
                    onPress={() => setGoalType({ name: "distance", unit: "km" })}>
                    <Text>Distance</Text>
                </Pressable>
            </View>
            <View className="flex-row items-end p-4">
                <TextInput className="text-8xl"
                    onChangeText={(val) => setGoal(val)}
                    value={goal}
                    inputMode='numeric'
                />
                <Text>{goalType.unit}</Text>
            </View>
            <Text>Settings for the chatbot.......</Text>
            <Pressable onPress={() => router.navigate(
                {
                    pathname: "/run",
                    params: { goal: parseInt(goal), name: goalType.name, unit: goalType.unit }
                })}>
                <Text>Start a run</Text>
            </Pressable>
        </View>
    );
}
