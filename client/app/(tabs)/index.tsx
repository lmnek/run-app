import { router } from 'expo-router';
import { useState } from 'react';
import { View, Pressable, Text, TextInput } from 'react-native';
import * as Location from 'expo-location'
import { trpc } from '../../utils/trpc';

export enum GoalType { Duration = "Duration", Distance = "Distance" }

export default function Setup() {
    let [goal, setGoal] = useState("10")
    let [goalType, setGoalType] = useState(GoalType.Duration)
    const [errorMsg, setErrorMsg] = useState<null | string>(null);

    const startRun = trpc.startRun.useMutation();

    // TODO: settings for the chatbot

    const onConfirm = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg("Permission to access location was denied. \n Can't track the run.");
            return;
        }

        const { unit } = getGoalDetails(goalType)
        const goalInfo = { type: goalType, value: parseInt(goal), unit }
        console.log("Goal info:", JSON.stringify(goalInfo))

        const entranceTimestamps = entrancesDistribution(goalInfo.value, goalType, "high")
        console.log("Entrance timestamps:", entranceTimestamps)

        startRun.mutateAsync({
            goalInfo,
            topic: "Easy run",
            entranceCount: entranceTimestamps.length + 1
        })


        router.navigate({
            pathname: "/timer",
            params: { ...goalInfo, entranceTimestampsParams: entranceTimestamps }
        })
    }

    return (
        <View className="flex items-center justify-center space-y-5 pt-4">
            <View className="flex-row space-x-2">
                <Pressable
                    className={goalType === GoalType.Duration ? "bg-red-200" : ""}
                    onPress={() => setGoalType(GoalType.Duration)}>
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

const distance_data = {
    base: 10000, // m
    end_buffer: 300,
    intervals: {
        high: 750,
        medium: 1500,
        low: 3000
    }
}

const duration_data = {
    base: 60, // min
    end_buffer: 2.5,
    intervals: {
        high: 5,
        medium: 10,
        low: 20
    }
}

function entrancesDistribution(goal: number, goalType: GoalType, frequency: "high" | "medium" | "low"): number[] {
    const data = goalType === GoalType.Duration ? duration_data : distance_data
    const interval = data.intervals[frequency]

    const scaled_interval = interval * Math.sqrt(goal / data.base)
    const entranceCount = Math.max(2, Math.floor(goal / scaled_interval)) + 1

    const interval_between = (goal - data.end_buffer) / (entranceCount - 1)

    const intervals = []
    for (let i = 1; i < entranceCount; i++) {
        intervals.push(i * interval_between)
    }
    return intervals
}

function getGoalDetails(goalType: GoalType) {
    if (goalType === GoalType.Duration) {
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
