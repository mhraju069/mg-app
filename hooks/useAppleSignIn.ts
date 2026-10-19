import auth from "@react-native-firebase/auth";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { useState } from "react";

export function useAppleSignIn() {
    const [isLoading, setIsLoading] = useState(false);

    const appleAuthSupported = async () => {
        if (Platform.OS === "ios") {
            try {
                return await AppleAuthentication.isAvailableAsync();
            } catch (e) {
                return false;
            }
        } else {
            // Android uses a web-based flow which is always available via Firebase
            return true;
        }
    };

    const signInWithApple = async () => {
        console.log("Starting Apple Sign-In...");
        setIsLoading(true);

        try {
            if (Platform.OS === "ios") {
                // Request Apple Sign-In without a manual nonce to avoid expo-crypto dependency
                const credential = await AppleAuthentication.signInAsync({
                    requestedScopes: [
                        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                        AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    ],
                });

                if (!credential.identityToken) {
                    throw new Error("No Identity Token received from Apple");
                }

                // Create Firebase credential using just the identity token
                const firebaseCredential = auth.AppleAuthProvider.credential(
                    credential.identityToken
                );

                await auth().signInWithCredential(firebaseCredential);
                console.log("Apple Sign-In Success on iOS");
            } else {
                // For Android, we use the Firebase OAuth provider (web-based flow)
                const provider = new auth.OAuthProvider('apple.com');

                provider.addScope('email');
                provider.addScope('name');

                await auth().signInWithProvider(provider);
                console.log("Apple Sign-In Success on Android (via Firebase OAuth)");
            }
        } catch (error: any) {
            // Handle common cancellation codes
            if (error.code === 'ERR_CANCELED' || error.message?.toLowerCase().includes('cancel')) {
                console.log("User canceled Apple Sign-In");
            } else {
                console.error("Apple Sign-In Error: ", error);
                throw error;
            }
        } finally {
            setIsLoading(false);
        }
    };

    return { signInWithApple, appleAuthSupported, isLoading };
}
