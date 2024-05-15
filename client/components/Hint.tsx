import { Info } from 'lucide-react-native';
import * as React from 'react';
import { Button } from '~/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Text } from '~/components/ui/text';

// Hint component that is shown next to a setting
// to explain it in detail
export default function Hint({ text }: { text: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button size='icon' variant='ghost'>
                    <Info size='17' strokeWidth='3' color='#808080' />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className='w-60'
            >
                <Text className='text-m text-muted-foreground'>
                    {text}
                </Text>
            </PopoverContent>
        </Popover>
    )
}
