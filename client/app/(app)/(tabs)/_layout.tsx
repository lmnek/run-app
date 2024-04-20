import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: 'darkorange',
            tabBarStyle: {
                height: 70,
                borderTopWidth: 3
                // backgroundColor: 'gray',
            },
            headerStyle: { backgroundColor: 'gray' },
            tabBarShowLabel: false
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

