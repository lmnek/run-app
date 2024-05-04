import React from 'react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const intentTypes = ['Base', 'Recovery', 'Long', 'Tempo', 'Race']

export const IntentSelect = ({ setIntent }: { setIntent: (value: string | undefined) => void }) => {
    return (
        <>
            <Label nativeID='select'>Intent</Label>
            <Select className='select w-[150]' onValueChange={(option) => { setIntent(option?.value) }}>
                <SelectTrigger>
                    <SelectValue
                        className='text-sm native:text-lg'
                        placeholder='Enter run intent...'
                    />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Intent</SelectLabel>
                        {intentTypes.map((intent) => {
                            const str = intent + (intent === "Race" ? "" : " run")
                            return <SelectItem
                                key={str}
                                label={str}
                                value={str} >
                                {intent}
                            </SelectItem>
                        })}
                    </SelectGroup>
                </SelectContent>
            </Select >
        </>
    )
}
