import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Text } from '~/components/ui/text';

// TODO: forgot password

export default function SignInScreen() {
    const { isLoaded: isLoadedSignUp, signUp, setActive: setActiveSignUp } = useSignUp();
    const { signIn, setActive: setActiveSignIn, isLoaded: isLoadedSignIn } = useSignIn();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");

    const [errors, setErrors] = useState<string[]>([])
    const setFromError = (errs: any) => {
        // console.log(JSON.stringify(errs))
        const newErrors = errs.map((e: any) => e.longMessage)
        setErrors(newErrors)
    }

    // start the sign up process.
    const onSignUpPress = async () => {
        if (!isLoadedSignUp) { return; }
        try {
            await signUp.create({
                emailAddress,
                password,
            });

            // send the email.
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

            // change the UI to our pending section.
            setPendingVerification(true);
            setErrors([])
        } catch (err: any) { setFromError(err.errors) }
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
        } catch (err: any) { setFromError(err.errors) }
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
        } catch (err: any) { setFromError(err.errors) }
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
                    />

                    <Input
                        value={password}
                        placeholder="Password..."
                        secureTextEntry={true}
                        onChangeText={(password) => setPassword(password)}
                    />

                    <Button onPress={onSignInPress}>
                        <Text className='text-white'>Sign in</Text>
                    </Button>
                    <Button variant='secondary' onPress={onSignUpPress}>
                        <Text>Sign up</Text>
                    </Button>
                    <Button variant='ghost' onPress={() => { }}>
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
