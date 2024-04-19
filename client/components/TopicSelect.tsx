import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Button } from './ui/button'
import { Text } from './ui/text'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { RefreshCcw } from 'lucide-react-native'

const RANDOM_TOPICS_COUNT = 3

const topics = ["Passion", "Motivation", "Weather Conditions", "Running Technique", "Nutrition", "Race Preparation", "First run", "Mindfullnes", "Running History", "Endurance", "Recovery Strategies", "Running Gear", "Music and Running", "Trail Running", "Personal Bests", "Injury Prevention", "Running Clubs", "Famous Runners", "Run the Iconic Marathons", "Mental Grit in Sports", "Eco-Friendly Running", "Running Through the Seasons", "Extreme Weather", "Science of Running", "Hydration", "Biomechanics", "Mindset", "Altitude", "Recovery", "Cross-Training", "Tactics", "Flexibility", "Speedwork", "Hillwork", "Stamina", "Cooldown", "Intervals", "Pacing", "Footwear", "Strategy", "Strength", "Breathing", "Resilience", "Focus", "Gear", "Warm-up", "Form", "Balance", "Endurance", "Terrain"];


export default function TopicSelect({ topic, setTopic }
    : { topic: null | string, setTopic: (value: string | null) => void }) {
    const [selecting, setSelecting] = useState(false)
    const [randomTopics, setRandomTopics] = useState<string[]>([])


    useEffect(() => {
        randomizeTopics()
    }, [])

    const randomizeTopics = () => {
        const newTopics: string[] = []
        while (newTopics.length < RANDOM_TOPICS_COUNT) {
            const idx = Math.floor(Math.random() * topics.length)
            const newTopic = topics[idx]
            if (!randomTopics.includes(newTopic) && !newTopics.includes(newTopic)) {
                newTopics.push(newTopic)
            }
        }
        setTopic(null)
        setRandomTopics(newTopics)
    }

    return (
        <>
            <View className='flex-row items-center gap-2'>
                <Switch checked={selecting} onCheckedChange={setSelecting} nativeID='topics-switch' />
                <Label
                    nativeID='topics-switch'
                    onPress={() => { setSelecting((prev) => !prev); }}
                > Topic </Label>
                {
                    selecting &&
                    <Button size='icon' onPress={randomizeTopics}>
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

