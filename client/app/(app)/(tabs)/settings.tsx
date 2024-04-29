import { useAuth } from '@clerk/clerk-expo';
import { View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '~/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Switch } from '~/components/ui/switch';
import { Text } from '~/components/ui/text';
import { frequencies, llmModels, temperatures, useSettingsStore, voices } from '~/utils/stores/settingsStore';

export default function Settings() {
    const [privateMode, voice, llmModel, temperature, frequency] = useSettingsStore(useShallow(state =>
        [state.privateMode, state.voice, state.llmModel, state.temperature, state.frequency]))
    const [setPrivateMode, setVoice, setLlmModel, setTemperature, setFrequency] = useSettingsStore(useShallow(state =>
        [state.setPrivateMode, state.setVoice, state.setLlmModel, state.setTemperature, state.setFrequency]))

    const { signOut } = useAuth();

    return (
        <View className='flex-1 justify-between p-16'>
            <View className='flex gap-y-8'>
                <SelectSettingsItem
                    label='AI Model'
                    options={llmModels}
                    val={llmModel}
                    setVal={setLlmModel}
                />
                <SelectSettingsItem
                    label='Frequency'
                    options={[...frequencies]}
                    val={frequency}
                    setVal={setFrequency}
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
                />
                <SettingsItem label='Private Mode'>
                    <Switch checked={privateMode} onCheckedChange={setPrivateMode} />
                </SettingsItem>
            </View>
            <Button
                variant='secondary'
                className='bg-red-50'
                onPress={() => { signOut() }}>
                <Text>Logout</Text>
            </Button>
        </View>
    );
}

type PropsSelect<T> = {
    label: string,
    options: T[],
    val: T,
    setVal: (val: T) => void
}

// TODO: same width for all selects
function SelectSettingsItem<T extends string>({ label, options, val, setVal }: PropsSelect<T>) {
    return <SettingsItem label={label}>
        <Select
            onValueChange={(option) => { if (option) { setVal(option.value as T) } }}
            value={{ value: val, label: val }}
        >
            <SelectTrigger>
                <SelectValue className='text-sm native:text-lg' placeholder='...' />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {options.map((v) => (
                        <SelectItem key={v} label={v} value={v}>
                            {v}
                        </SelectItem>))}
                </SelectGroup>
            </SelectContent>
        </Select >
    </SettingsItem>
}

type PropsSettingsItem = {
    children: JSX.Element | JSX.Element[],
    label: string
}

function SettingsItem({ children, label }: PropsSettingsItem) {
    return (
        <View className='flex flex-row justify-between items-center'>
            <Text className='text-xl'>{label}</Text>
            {children}
        </View>
    )
}

