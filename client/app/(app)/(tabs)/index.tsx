import { router } from 'expo-router';
import { Component, useState } from 'react';
import { View } from 'react-native';
import * as Location from 'expo-location'
import { trpc } from 'utils/trpc';
import { Text } from 'components/ui/text';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { GoalType, entrancesDistribution, getGoalDetails } from 'utils/distribution';
import TopicSelect from 'components/TopicSelect';
import { IntentSelect } from 'components/IntentSelect';
import { Label } from 'components/ui/label';


export default function Setup() {
    let [goal, setGoal] = useState("10")
    let [goalType, setGoalType] = useState(GoalType.Duration)
    const [errorMsg, setErrorMsg] = useState<null | string>(null);
    const [topic, setTopic] = useState<null | string>(null)
    const [intent, setIntent] = useState<undefined | string>(undefined)

    const startRun = trpc.startRun.useMutation();

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
            goalInfo, topic: topic || "", intent: intent || "",
            entranceCount: entranceTimestamps.length + 1
        })


        router.navigate({
            pathname: "/timer",
            params: { ...goalInfo, entranceTimestampsParams: entranceTimestamps }
        })
    }

    return (
        <View className="flex items-center justify-center gap-y-5 pt-4">
            <View className="flex-row gap-x-3">
                <Button
                    variant={goalType === GoalType.Duration ? "secondary" : "outline"}
                    onPress={() => setGoalType(GoalType.Duration)}>
                    <Text>Time</Text>
                </Button>
                <Button
                    variant={goalType === GoalType.Distance ? "secondary" : "outline"}
                    onPress={() => setGoalType(GoalType.Distance)}>
                    <Text>Distance</Text>
                </Button>
            </View>
            <View className="flex-row items-end p-4 gap-x-3">
                <Input className="text-2xl"
                    aria-labelledby='goal-input'
                    onChangeText={(val) => setGoal(val)}
                    value={goal}
                    inputMode='numeric'
                />
                <Label nativeID='goal-input'>{getGoalDetails(goalType).unit}</Label>
            </View>

            <IntentSelect setIntent={setIntent} />
            <TopicSelect topic={topic} setTopic={setTopic} />

            <Text className='text-red-500 text-center'> {errorMsg} </Text>
            <Button onPress={onConfirm}>
                <Text>Start a run</Text>
            </Button>
        </View >
    );
}

