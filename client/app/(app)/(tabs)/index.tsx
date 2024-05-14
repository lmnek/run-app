import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { View } from 'react-native';
import * as Location from 'expo-location'
import { PrivateData, trpc } from 'utils/trpc';
import { Text } from 'components/ui/text';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { entrancesDistribution } from 'utils/distribution';
import TopicSelect from 'components/TopicSelect';
import { IntentSelect } from 'components/IntentSelect';
import { useGoalStore, GoalType } from '~/utils/stores/goalStore';
import { useSettingsStore } from '~/utils/stores/settingsStore';
import { useShallow } from 'zustand/react/shallow';


export default function Setup() {
    const [errorMsg, setErrorMsg] = useState<null | string>(null);

    const { setIntent, setGoalValue, setGoalType, getAllData, setTimestamps }
        = useGoalStore(state => state.api)
    const goal = useGoalStore((state) => state.goalInfo)

    const [voice, llmModel, privateMode, temperature, frequency, username] = useSettingsStore(useShallow(state =>
        [state.voice, state.llmModel, state.privateMode, state.temperature, state.frequency, state.username]))

    const startRun = trpc.narration.startRun.useMutation()

    const trpcUtils = trpc.useUtils()
    // on Mount
    useEffect(() => {
        // Put run history into react-query cache
        trpcUtils.db.getRunsHistory.prefetch()
    }, [])

    async function getPrivateData(): Promise<PrivateData | undefined> {
        if (privateMode) {
            return undefined
        }
        const curPos = await Location.getCurrentPositionAsync({ accuracy: Location.LocationAccuracy.Balanced })
        return {
            lat: curPos.coords.latitude,
            long: curPos.coords.longitude,
            username: username ?? ''
        }
    }

    const onConfirm = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg("Permission to access location was denied. \n Can't track the run.");
            return;
        }

        let privateDataPromise = getPrivateData()

        console.log("Goal info:", JSON.stringify(goal))

        const entranceTimestamps = entrancesDistribution(goal.value, goal.type, frequency)
        setTimestamps(entranceTimestamps)

        const { entranceTimestamps: _, ...startRunArgs } = getAllData()
        startRun.mutateAsync({
            ...startRunArgs,
            entranceCount: entranceTimestamps.length + 1,
            privateData: await privateDataPromise,
            temperature, voice, llmModel,
        })

        router.navigate("/timer")
    }

    const checkGoalError = (goal: number, goalType: GoalType) => {
        if (goalType === GoalType.Duration) {
            const durLimit = 5
            setErrorMsg(goal < durLimit
                ? `Goal must be at least ${durLimit} mins`
                : null)
        }
        else if (goalType === GoalType.Distance) {
            const distLimit = 2
            setErrorMsg(goal < distLimit
                ? `Goal must be at least ${distLimit} km`
                : null)
        }
    }

    function GoalTypeButton({ goalType, unit }: { goalType: GoalType, unit: string }) {
        return <Button
            variant={goal.type === goalType ? "outline" : "outline"}
            className={"border-2 " + (goal.type === goalType ? "border-secondary" : "")}
            onPress={() => {
                setGoalType(goalType)
                checkGoalError(goal.value, goalType)
            }}
        >
            <Text>{goalType} ({unit})</Text>
        </Button>
    }

    return (
        <View className='flex-1 justify-between px-16 py-8'>
            <View className="flex items-center justify-center gap-y-5">
                <View className="flex-row gap-x-3">
                    <GoalTypeButton goalType={GoalType.Duration} unit='min' />
                    <GoalTypeButton goalType={GoalType.Distance} unit='km' />
                </View>
                <View className="p-4 pb-4">
                    <Input className="text-6xl px-8 py-2"
                        aria-labelledby='goal-input'
                        onChangeText={(value: string) => {
                            if (value.length <= 3) {
                                const parsedVal = parseInt(value)
                                checkGoalError(parsedVal, goal.type)
                                setGoalValue(parsedVal)
                            }
                        }}
                        value={isNaN(goal.value) ? '' : goal.value.toString()}
                        inputMode='numeric'
                        returnKeyType='done'
                    />
                </View>

                <View className='py-2'>
                    <IntentSelect setIntent={setIntent} />
                </View>
                <TopicSelect />
            </View >
            <View className='flex'>
                <Text className='text-red-500 text-center'> {errorMsg} </Text>
                <Button
                    disabled={(errorMsg !== null) || isNaN(goal.value)}
                    onPress={onConfirm}
                    size='lg'
                    className='shadow-primary'
                >
                    <Text className='font-bold text-foreground'>Start a run</Text>
                </Button>
            </View>
        </View>
    );
}

