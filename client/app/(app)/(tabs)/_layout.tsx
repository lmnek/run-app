import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { PRIMARY_RGB } from '~/lib/constants';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: PRIMARY_RGB,
            tabBarStyle: {
                height: 70,
                borderTopWidth: 3
                // backgroundColor: 'gray',
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
                }}
            />
        </Tabs>
    );
}

