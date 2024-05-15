import { Redirect, Stack, router } from 'expo-router';
import { trpc } from 'utils/trpc';

import * as React from 'react';
import { PortalHost } from 'components/primitives/portal';
import { useAuth } from '@clerk/clerk-expo';
import { useRunDetailStore } from '~/utils/stores/runDetailsStore';
import { DetailMoreButton } from './detail';

// Main Stack Layout when the user is logged in
export default function Layout() {
    const { isLoaded, userId } = useAuth()

    // Protect (app) route
    // Also in case the user signs out while on the page
    if (!isLoaded || !userId) {
        return <Redirect href='auth' />
    }

    const runDetailId = useRunDetailStore(state => state.id)
    const deleteRun = trpc.db.deleteRun.useMutation()
    const trpcUtils = trpc.useUtils()
    const deleteRunAndReturn = () => {
        if (runDetailId) {
            deleteRun.mutateAsync(runDetailId)
                .then(async () => {
                    trpcUtils.db.getRunsHistory.invalidate()
                    router.back()
                })
        }
    }

    return <>
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerTitle: "Home", headerShown: false }} />
            <Stack.Screen name="timer" options={{ headerTitle: "Countdown" }} />
            <Stack.Screen name="run" options={{ headerTitle: "Run", }} />
            <Stack.Screen name="detail" options={{
                headerTitle: "Detail",
                headerRight: () => <DetailMoreButton deleteRun={deleteRunAndReturn} />
            }} />
        </Stack>
        <PortalHost />
    </>
}

