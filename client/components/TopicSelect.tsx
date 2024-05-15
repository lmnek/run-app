import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Button } from './ui/button'
import { Text } from './ui/text'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { RefreshCcw } from 'lucide-react-native'
import { useGoalStore } from '~/utils/stores/goalStore';

const RANDOM_TOPICS_COUNT = 3

// All of the topics that can be randomly selected
const topics = ["Passion", "Motivation", "Weather Conditions", "Running Technique", "Nutrition", "Race Preparation", "First run", "Mindfullnes", "Running History", "Endurance", "Recovery Strategies", "Running Gear", "Music and Running", "Trail Running", "Personal Bests", "Injury Prevention", "Running Clubs", "Famous Runners", "Run the Iconic Marathons", "Mental Grit in Sports", "Eco-Friendly Running", "Running Through the Seasons", "Extreme Weather", "Science of Running", "Hydration", "Biomechanics", "Mindset", "Altitude", "Recovery", "Cross-Training", "Tactics", "Flexibility", "Speedwork", "Hillwork", "Stamina", "Cooldown", "Intervals", "Pacing", "Footwear", "Strategy", "Strength", "Breathing", "Resilience", "Focus", "Gear", "Warm-up", "Form", "Balance", "Endurance", "Terrain"];

// Component to select the topic of the run
export default function TopicSelect() {
    const topic = useGoalStore(state => state.topic)
    const setTopic = useGoalStore(state => state.api.setTopic)

    const [selecting, setSelecting] = useState(true)
    const [randomTopics, setRandomTopics] = useState<string[]>([])

    useEffect(() => {
        randomizeTopics()
    }, [])

    // Always show random 3 topics to choose from
    // (can be refreshed)
    const randomizeTopics = () => {
        const newTopics: string[] = []
        while (newTopics.length < RANDOM_TOPICS_COUNT) {
            const idx = Math.floor(Math.random() * topics.length)
            const newTopic = topics[idx]
            if (!randomTopics.includes(newTopic) && !newTopics.includes(newTopic)) {
                newTopics.push(newTopic)
            }
        }
        setTopic(undefined)
        setRandomTopics(newTopics)
    }

    // Turn off / on the option to select a topic
    const onSwitchPress = () => {
        setTopic(undefined)
        setSelecting((prev) => !prev)
    }

    return (
        <>
            <View className='flex-row items-center gap-2'>
                <Switch checked={selecting} onCheckedChange={onSwitchPress} nativeID='topics-switch' />
                <Label
                    nativeID='topics-switch'
                    onPress={onSwitchPress}
                > Topic </Label>
                {
                    selecting &&
                    <Button
                        variant='secondary'
                        size='icon'
                        onPress={randomizeTopics}
                    >
                        <RefreshCcw size={16} strokeWidth={3} color='#ffffff' />
                    </Button>
                }
            </View>

            {selecting &&
                <View className='flex gap-y-3' aria-labelledby='topics'>
                    {randomTopics.map((t) => {
                        return <Button
                            key={t}
                            onPress={() => { setTopic(t) }}
                            variant={t === topic ? 'secondary' : 'outline'}>
                            <Text>{t}</Text>
                        </Button>
                    })}
                </View>
            }
        </>
    )
}

