import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import * as Location from 'expo-location'
import { trpc } from 'utils/trpc';
import { Text } from 'components/ui/text';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { entrancesDistribution } from 'utils/distribution';
import TopicSelect from 'components/TopicSelect';
import { IntentSelect } from 'components/IntentSelect';
import { Label } from 'components/ui/label';
import useGoalStore, { GoalType } from '~/utils/store';


export default function Setup() {
    const [errorMsg, setErrorMsg] = useState<null | string>(null);

    const goalStore = useGoalStore()
    const { setIntent, setTopic, setGoalValue, setGoalType
        , goalInfo: goal, topic } = goalStore

    const startRun = trpc.naration.startRun.useMutation();

    const onConfirm = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg("Permission to access location was denied. \n Can't track the run.");
            return;
        }

        console.log("Goal info:", JSON.stringify(goal))

        const entranceTimestamps = entrancesDistribution(goal.value, goal.type, "high")
        console.log("Entrance timestamps:", entranceTimestamps)
        goalStore.setTimestamps(entranceTimestamps)

        const { entranceTimestamps: _, ...startRunArgs } = goalStore.getAllData()
        startRun.mutateAsync({
            ...startRunArgs,
            entranceCount: entranceTimestamps.length + 1
        })

        router.navigate("/timer")
    }

    return (
        <View className="flex items-center justify-center gap-y-5 pt-4">
            <View className="flex-row gap-x-3">
                <Button
                    variant={goal.type === GoalType.Duration ? "secondary" : "outline"}
                    onPress={() => setGoalType(GoalType.Duration)}>
                    <Text>Time</Text>
                </Button>
                <Button
                    variant={goal.type === GoalType.Distance ? "secondary" : "outline"}
                    onPress={() => setGoalType(GoalType.Distance)}>
                    <Text>Distance</Text>
                </Button>
            </View>
            <View className="flex-row items-end p-4 gap-x-3">
                <Input className="text-2xl"
                    aria-labelledby='goal-input'
                    onChangeText={(val) => setGoalValue(parseInt(val))}
                    value={goal.value.toString()}
                    inputMode='numeric'
                />
                <Label nativeID='goal-input'>{goal.unit}</Label>
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

