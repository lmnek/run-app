import { router } from 'expo-router';
import { useEffect, useState } from 'react';

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
import { useGoalStore, GoalType } from '~/utils/stores/goalStore';
import { useSettingsStore } from '~/utils/stores/settingsStore';
import { useShallow } from 'zustand/react/shallow';


export default function Setup() {
    const [errorMsg, setErrorMsg] = useState<null | string>(null);

    const { setIntent, setGoalValue, setGoalType, getAllData, setTimestamps }
        = useGoalStore(state => state.api)
    const goal = useGoalStore((state) => state.goalInfo)

    const [voice, llmModel, privateMode, temperature, frequency] = useSettingsStore(useShallow(state =>
        [state.voice, state.llmModel, state.privateMode, state.temperature, state.frequency]))

    const startRun = trpc.naration.startRun.useMutation();

    const trpcUtils = trpc.useUtils()
    // on Mount
    useEffect(() => {
        // Put run history into react-query cache
        trpcUtils.db.getRunsHistory.prefetch()
    }, [])

    const onConfirm = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg("Permission to access location was denied. \n Can't track the run.");
            return;
        }

        console.log("Goal info:", JSON.stringify(goal))

        const entranceTimestamps = entrancesDistribution(goal.value, goal.type, frequency)
        setTimestamps(entranceTimestamps)

        const { entranceTimestamps: _, ...startRunArgs } = getAllData()
        startRun.mutateAsync({
            ...startRunArgs,
            entranceCount: entranceTimestamps.length + 1,
            temperature, voice, llmModel, privateMode
        })

        router.navigate("/timer")
    }

    return (
        <View className="flex items-center justify-center gap-y-5 pt-16">
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
            <View className="flex-row items-end p-4 pb-10 gap-x-3">
                <Input className="text-2xl"
                    aria-labelledby='goal-input'
                    onChangeText={(val) => {
                        const parsedVal = parseInt(val)
                        setGoalValue(parsedVal)
                    }}
                    value={isNaN(goal.value) ? '' : goal.value.toString()}
                    inputMode='numeric'
                />
                <Label nativeID='goal-input'>{goal.unit}</Label>
            </View>

            <IntentSelect setIntent={setIntent} />
            <TopicSelect />

            <Text className='text-red-500 text-center'> {errorMsg} </Text>
            <Button disabled={isNaN(goal.value)} onPress={onConfirm}>
                <Text>Start a run</Text>
            </Button>
        </View >
    );
}

