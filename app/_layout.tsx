import { Stack } from 'expo-router';

export default function Layout() {
    // screenOptions={{
    //             headerStyle: {
    //                 backgroundColor: '#f4511e',
    //             },
    //             headerTintColor: '#fff',
    //             headerTitleStyle: {
    //                 fontWeight: 'bold',
    //             },
    //         }}
    // >

    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerTitle: "Home", headerShown: false }} />
            <Stack.Screen name="run" options={{ headerTitle: "Run" }} />
        </Stack>
    );
}

