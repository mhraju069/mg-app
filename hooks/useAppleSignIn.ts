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

    const exchangeWithBackend = async (firebaseUser: any) => {
        const firebaseIdToken = await firebaseUser.getIdToken();
        const { API_BASE_URL } = await import("@/utils/constants");
        const { useAuthStore } = await import("@/utils/authStore");

        const response = await fetch(`${API_BASE_URL}/auth/firebase-login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_token: firebaseIdToken,
                role: "user",
            }),
        });

        const data = await response.json();
        if (response.ok && data.status && data.access) {
            useAuthStore.login({
                user: data.user,
                access: data.access,
                refresh: data.refresh,
            });
            return data.user;
        } else {
            const errMsg = data.log || data.message || "Failed to authenticate with server.";
            throw new Error(errMsg);
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

                const userCred = await auth().signInWithCredential(firebaseCredential);
                console.log("Apple Sign-In Success on iOS");
                await exchangeWithBackend(userCred.user);
            } else {
                // For Android, we use the Firebase OAuth provider (web-based flow)
                const provider = new auth.OAuthProvider('apple.com');

                provider.addScope('email');
                provider.addScope('name');

                const userCred = await auth().signInWithProvider(provider);
                console.log("Apple Sign-In Success on Android (via Firebase OAuth)");
                await exchangeWithBackend(userCred.user);
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
