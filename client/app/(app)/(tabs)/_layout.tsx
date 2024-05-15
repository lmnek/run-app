import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { PRIMARY_RGB } from '~/lib/constants';
import { Platform } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { SignOutButton } from '~/app/auth';

// The tab layout at the bottom of the screen in the main menu
export default function TabLayout() {
    const { signOut } = useAuth()

    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: PRIMARY_RGB,
            tabBarStyle: {
                height: Platform.OS === 'ios' ? 100 : 70,
                borderTopWidth: 2
            },
            tabBarShowLabel: false,
            headerStyle: { backgroundColor: PRIMARY_RGB }
        }}>
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    tabBarIcon: ({ color }) => <FontAwesome size={24} name="list" color={color} />,
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Run',
                    tabBarIcon: ({ color }) => <FontAwesome size={34} name="play" color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => <FontAwesome size={26} name="gear" color={color} />,
                    headerRight: () => <SignOutButton signOut={async () => { await signOut() }} />,
                }}
            />
        </Tabs>
    );
}


