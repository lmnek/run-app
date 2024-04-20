import { useAuth } from '@clerk/clerk-expo';
import { View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

export default function Settings() {
    const { signOut } = useAuth();

    return (
        <View className='flex gap-y-8 p-16'>
            <Text>Settings...</Text>

            <Button variant='secondary'
                onPress={() => { signOut() }}>
                <Text>Logout</Text>
            </Button>
        </View>
    );
}
