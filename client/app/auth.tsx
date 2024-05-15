import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { LogOut } from "lucide-react-native";
import { useState } from "react";
import { Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Text } from '~/components/ui/text';
import { logger } from "~/utils/logger";

// Some code is from the offical Clerk-Expo guide:
// https://clerk.com/docs/quickstarts/expo

// Screens when the user is not logged in
export default function SignInScreen() {
    const { isLoaded: isLoadedSignUp, signUp, setActive: setActiveSignUp } = useSignUp();
    const { signIn, setActive: setActiveSignIn, isLoaded: isLoadedSignIn } = useSignIn();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");

    const [errors, setErrors] = useState<string[]>([])
    const setFromError = (error: any) => {
        logger.error(JSON.stringify(error))
        const newErrors = error.errors.map((e: any) => e.longMessage)
        setErrors(newErrors)
    }

    // Start the sign up process.
    const onSignUpPress = async () => {
        if (!isLoadedSignUp) { return; }
        try {
            await signUp.create({
                emailAddress,
                password,
            });

            // send the email
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

            // change the UI to our pending section
            setPendingVerification(true);
            setErrors([])
        } catch (err: any) { setFromError(err) }
    };

    // This verifies the user using email code that is delivered.
    const onPressVerify = async () => {
        if (!isLoadedSignUp) { return; }
        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            await setActiveSignUp({ session: completeSignUp.createdSessionId });
            setErrors([])
        } catch (err: any) { setFromError(err) }
    };

    const onSignInPress = async () => {
        if (!isLoadedSignIn) { return; }
        try {
            const completeSignIn = await signIn.create({
                identifier: emailAddress,
                password,
            });
            // This is an important step,
            // This indicates the user is signed in
            await setActiveSignIn({ session: completeSignIn.createdSessionId });
            setErrors([])
        } catch (err: any) { setFromError(err) }
    };

    return (<SafeAreaView>
        <View className="flex gap-y-5 pt-24 px-16">
            {!pendingVerification && (
                <>
                    <Input
                        autoCapitalize="none"
                        value={emailAddress}
                        placeholder="Email..."
                        onChangeText={(email) => setEmailAddress(email)}
                        className='p-2'
                    />
                    <Input
                        value={password}
                        placeholder="Password..."
                        secureTextEntry={true}
                        onChangeText={(password) => setPassword(password)}
                        className='p-2'
                    />

                    <Button onPress={onSignInPress}>
                        <Text className='text-primary-foreground'>Sign in</Text>
                    </Button>
                    <Button variant='outline' onPress={onSignUpPress}>
                        <Text>Sign up</Text>
                    </Button>
                    <Button variant='ghost' className='shadow-white' onPress={() => {
                        /*  TODO: forgot password */
                    }}>
                        <Text className='text-center underline'>Forgot password</Text>
                    </Button>
                </>
            )}
            {pendingVerification && (
                <>
                    <Input
                        value={code}
                        placeholder="Code..."
                        onChangeText={(code) => setCode(code)}
                        className='p-2'
                    />
                    <Button onPress={onPressVerify}>
                        <Text>Verify Email</Text>
                    </Button>
                    <Button variant='outline' onPress={() => { setPendingVerification(false) }}>
                        <Text>Return</Text>
                    </Button>
                </>
            )}
            {errors.map((e, i) => {
                return <Text className='text-red-500' key={i}>{e}</Text>
            })}
        </View>
    </SafeAreaView>
    );
}

// In the status bar of the settings page
export function SignOutButton({ signOut }: { signOut: () => void }) {
    return <View className='flex-row'>
        <Button
            variant='ghost'
            size='icon'
            onPress={() => {
                Alert.alert('Do you want to sign out?', undefined, [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Continue',
                        onPress: signOut,
                        style: 'destructive'
                    }
                ], { cancelable: true })
            }}
        >
            <LogOut size={22} strokeWidth={2} color='#696969' />
        </Button>
        <View className='px-3'></View>
    </View>
}
