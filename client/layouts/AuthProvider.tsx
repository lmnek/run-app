import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo";
import Auth from "~/app/auth";
import { ENV } from "~/utils/constants";
import * as SecureStore from 'expo-secure-store'

// As in: https://clerk.com/docs/quickstarts/expo

// Provider for all of the authentification services in the app
export default function AuthProvider({ children }: { children: JSX.Element | JSX.Element[] }) {
    return (
        <ClerkProvider
            tokenCache={tokenCache}
            publishableKey={ENV.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
            <SignedIn>
                {children}
            </SignedIn>
            <SignedOut>
                <Auth />
            </SignedOut>
        </ClerkProvider>
    )
}

// Caching for Clerk JWT in secure storage
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
}
