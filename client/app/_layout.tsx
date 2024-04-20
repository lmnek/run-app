import '../global.css';

import { Stack, SplashScreen, Slot } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform } from 'react-native';
import { NAV_THEME } from 'lib/constants';
import { useColorScheme } from 'lib/useColorScheme';
import { PortalHost } from 'components/primitives/portal';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store'
import Auth from './auth';
// import tailwindConfig from '~/tailwind.config';

const LIGHT_THEME: Theme = {
    dark: false,
    colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
    dark: true,
    colors: NAV_THEME.dark,
};
export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before getting the color scheme.
SplashScreen.preventAutoHideAsync();

// Caching for Clerk JWT
const tokenCache = {
    async getToken(key: string) {
        try {
            return SecureStore.getItemAsync(key);
        } catch (err) {
            return null;
        }
    },
    async saveToken(key: string, value: string) {
        try {
            return SecureStore.setItemAsync(key, value);
        } catch (err) {
            return;
        }
    },
};

// TODO: migrate envvars to expo config constants
// Securing with Clerk auth
const AuthLayout = () => (
    <ClerkProvider
        tokenCache={tokenCache}
        publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
        <SignedIn>
            <Slot />
        </SignedIn>
        <SignedOut>
            <Auth />
        </SignedOut>
    </ClerkProvider>
)


// Adding theme to the whole app layout
export default function Layout() {
    const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
    const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

    React.useEffect(() => {
        (async () => {
            const theme = await AsyncStorage.getItem('theme');
            if (Platform.OS === 'web') {
                // Adds the background color to the html element to prevent white background on overscroll.
                document.documentElement.classList.add('bg-background');
            }
            if (!theme) {
                AsyncStorage.setItem('theme', colorScheme);
                setIsColorSchemeLoaded(true);
                return;
            }
            const colorTheme = theme === 'dark' ? 'dark' : 'light';
            if (colorTheme !== colorScheme) {
                setColorScheme(colorTheme);

                setIsColorSchemeLoaded(true);
                return;
            }
            setIsColorSchemeLoaded(true);
        })().finally(() => {
            SplashScreen.hideAsync();
        });
    }, []);
    if (!isColorSchemeLoaded) {
        return null;
    }

    return (
        <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
            <StatusBar style={isDarkColorScheme ? 'light' : 'dark'} />
            <AuthLayout />
        </ThemeProvider>
    );
}

