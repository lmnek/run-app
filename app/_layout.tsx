import { Stack } from 'expo-router';

export default function Layout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#f4511e',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen name="index" options={{ headerTitle: "Home Page" }} />
            <Stack.Screen name="setup" options={{ headerTitle: "Run Setup" }} />
            <Stack.Screen name="run" options={{ headerTitle: "Run" }} />
        </Stack>
    );
}

