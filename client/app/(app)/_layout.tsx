import { Redirect, Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { trpc } from 'utils/trpc';
import { httpBatchLink } from '@trpc/client';

import * as React from 'react';
import { PortalHost } from 'components/primitives/portal';
import { useAuth } from '@clerk/clerk-expo';

export default function Layout() {
    const { isLoaded, userId, sessionId, getToken } = useAuth();

    // Protect (app) route
    // Also in case the user signs out while on the page
    if (!isLoaded || !userId) {
        return <Redirect href='auth' />
    }

    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() => trpc.createClient({
        links: [
            httpBatchLink({ url: process.env.EXPO_PUBLIC_TRPC_URL! })
        ]
    }));

    const stackLayoutComponent = (
        <>
            <Stack screenOptions={{
                headerStyle: { backgroundColor: "gray" }
            }}>
                <Stack.Screen name="(tabs)" options={{ headerTitle: "Home", headerShown: false }} />
                <Stack.Screen name="timer" options={{
                    headerTitle: "Countdown",
                    headerStyle: { backgroundColor: 'orange' }
                }} />
                <Stack.Screen name="run" options={{ headerTitle: "Run", }} />
            </Stack>
            <PortalHost />
        </>
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {stackLayoutComponent}
            </QueryClientProvider>
        </trpc.Provider>
    );

}

