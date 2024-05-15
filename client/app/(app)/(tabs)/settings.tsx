import { View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { SelectSettingsItem, SettingsItem } from '~/components/SettingsItem';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { Switch } from '~/components/ui/switch';
import { frequencies, llmModels, temperatures, useSettingsStore, voices } from '~/utils/stores/settingsStore';

// Screen for all of the main settings
export default function Settings() {
    const [privateMode, voice, llmModel, temperature, frequency, username] = useSettingsStore(useShallow(state =>
        [state.privateMode, state.voice, state.llmModel, state.temperature, state.frequency, state.username]))
    const [setPrivateMode, setVoice, setLlmModel, setTemperature, setFrequency, setUsername] = useSettingsStore(useShallow(state =>
        [state.setPrivateMode, state.setVoice, state.setLlmModel, state.setTemperature, state.setFrequency, state.setUsername]))

    return (
        <View className='flex-1 px-8 py-8 gap-y-10'>
            <SettingsItem label='Username'>
                <Input
                    value={username}
                    placeholder='Undefined...'
                    onChangeText={(val) => {
                        if (!val.includes(' ') && val.length < 16) {
                            setUsername(val)
                        }
                    }}
                    className='w-[110] p-4 text-l'
                />
            </SettingsItem>
            <Separator />
            <SelectSettingsItem
                label='AI Model'
                options={llmModels}
                val={llmModel}
                setVal={setLlmModel}
                hint='The large language model that will
                    be used for generation the coaching content.'
            />
            <SelectSettingsItem
                label='Frequency'
                options={[...frequencies]}
                val={frequency}
                setVal={setFrequency}
                hint='Sets how often the coach will enter the run.'
            />
            <SelectSettingsItem
                label='Voice'
                options={voices}
                val={voice}
                setVal={setVoice}
            />
            <SelectSettingsItem
                label='Creative Control'
                options={temperatures}
                val={temperature}
                setVal={setTemperature}
                hint='Defines how random the coaching content will be.'
            />
            <SettingsItem
                label='Private Mode'
                hint='When set, no geolocation and user identification data
                will be send into the AI model.'
            >
                <Switch checked={privateMode} onCheckedChange={setPrivateMode} />
            </SettingsItem>
        </View>
    )
}

