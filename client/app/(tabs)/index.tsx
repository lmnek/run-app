import { router } from 'expo-router';
import { useState } from 'react';
import { View, Pressable, Text, TextInput } from 'react-native';
import * as Location from 'expo-location'
import { trpc } from '../../utils/trpc';

export enum GoalType { Time, Distance }

export default function Setup() {
    let [goal, setGoal] = useState("10")
    let [goalType, setGoalType] = useState(GoalType.Time)
    const [errorMsg, setErrorMsg] = useState<null | string>(null);

    const startRun = trpc.startRun.useMutation();

    const onConfirm = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg("Permission to access location was denied. \n Can't track the run.");
            return;
        }

        const { unit } = getGoalDetails(goalType)
        const goalInfo = { type: goalType.toString(), value: parseInt(goal), unit }

        await startRun.mutateAsync({
            goalInfo
        })

        router.navigate({
            pathname: "/timer",
            params: goalInfo
        })
    }

    return (
        <View className="flex items-center justify-center space-y-5 pt-4">
            <View className="flex-row space-x-2">
                <Pressable
                    className={goalType === GoalType.Time ? "bg-red-200" : ""}
                    onPress={() => setGoalType(GoalType.Time)}>
                    <Text>Time</Text>
                </Pressable>
                <Pressable
                    className={goalType === GoalType.Distance ? "bg-red-200" : ""}
                    onPress={() => setGoalType(GoalType.Distance)}>
                    <Text>Distance</Text>
                </Pressable>
            </View>
            <View className="flex-row items-end p-4">
                <TextInput className="text-8xl"
                    onChangeText={(val) => setGoal(val)}
                    value={goal}
                    inputMode='numeric'
                />
                <Text>{getGoalDetails(goalType).unit}</Text>
            </View>

            <Text>Settings for the chatbot.......</Text>

            <Text className='text-red-500 text-center'>
                {errorMsg}
            </Text>
            <Pressable onPress={onConfirm}>
                <Text>Start a run</Text>
            </Pressable>
        </View>
    );
}

function getGoalDetails(goalType: GoalType) {
    if (goalType === GoalType.Time) {
        return {
            unit: "min",
            name: "Time"
        }

    } else {
        return {
            unit: "km",
            name: "Distance"
        }
    }
}
