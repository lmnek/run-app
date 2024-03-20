import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { trpc } from '../utils/trpc';
import { httpBatchLink } from '@trpc/client';

export default function Layout() {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() => trpc.createClient({
        //TODO: extract url into dotenv
        links: [
            httpBatchLink({ url: 'https://test.loca.lt/trpc' })
        ]
    }));

    const layoutComponent = (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerTitle: "Home", headerShown: false }} />
            <Stack.Screen name="run" options={{ headerTitle: "Run" }} />
        </Stack>
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {layoutComponent}
            </QueryClientProvider>
        </trpc.Provider>
    );
}

