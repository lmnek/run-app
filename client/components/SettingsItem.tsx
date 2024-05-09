import { View } from "react-native"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import Hint from "./Hint"
import { Text } from "./ui/text"

type PropsSelect<T> = {
    label: string,
    options: T[],
    val: T,
    setVal: (val: T) => void
    hint?: string
}

export function SelectSettingsItem<T extends string>({ label, options, val, setVal, hint }: PropsSelect<T>) {
    return <SettingsItem label={label} hint={hint}>
        <Select
            className='w-[110] text-right'
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
    hint?: string
}

export function SettingsItem({ children, label, hint }: PropsSettingsItem) {
    return (
        <View className='flex flex-row justify-between items-center'>
            <View className='flex-row items-center gap-x-1'>
                <Text className='text-xl'>{label}</Text>
                {hint && <Hint text={hint} />}
            </View>
            {children}
        </View>
    )
}

