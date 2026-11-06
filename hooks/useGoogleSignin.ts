import { useState } from "react";
import { Alert, Platform } from "react-native";

export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Check if native GoogleSignin is available (not available in Expo Go)
      let GoogleSigninModule: any;
      let statusCodes: any;
      let isErrorWithCode: any;

      try {
        const gModule = await import("@react-native-google-signin/google-signin");
        GoogleSigninModule = gModule.GoogleSignin;
        statusCodes = gModule.statusCodes;
        isErrorWithCode = gModule.isErrorWithCode;
      } catch (e) {
        Alert.alert(
          "Notice",
          "Google Sign-In is only available in a Development Build or standalone APK/IPA, not in Expo Go."
        );
        return;
      }

      // Safe configure
      if (Platform.OS !== "web") {
        try {
          GoogleSigninModule.configure({
            scopes: ["email", "profile"],
            webClientId: "924899435325-bl41d05ebdietd882sdta3tj1k8joo9r.apps.googleusercontent.com",
            offlineAccess: true,
          });
        } catch (confErr) {
          console.warn("GoogleSignin.configure error:", confErr);
        }
      }

      // Lazy load @react-native-firebase/auth to prevent crash in Expo Go
      let authModule: any;
      try {
        const fb = await import("@react-native-firebase/auth");
        authModule = fb.default;
      } catch (fbErr) {
        Alert.alert(
          "Notice",
          "Firebase Native Module is not available in Expo Go. Please use a Development Build (npx expo run:android / run:ios)."
        );
        return;
      }

      // Check if device has Google Play Services
      await GoogleSigninModule.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Optional: force fresh account picker
      try {
        await GoogleSigninModule.signOut();
      } catch (e) {
        // Ignore if not signed in
      }

      // Perform sign-in (In @react-native-google-signin v13+, signIn() returns SignInResponse)
      const signInResult = await GoogleSigninModule.signIn();
      console.log("Google Sign-In response:", JSON.stringify(signInResult));

      let idToken: string | null = null;

      // Extract idToken directly from signIn() if available
      if (signInResult && "data" in signInResult && signInResult.data) {
        idToken = signInResult.data.idToken;
      } else if (signInResult && "idToken" in signInResult) {
        idToken = (signInResult as any).idToken;
      }

      // Fallback to getTokens() if idToken is not in signIn() response
      if (!idToken) {
        const tokens = await GoogleSigninModule.getTokens();
        idToken = tokens.idToken;
      }

      console.log("Resolved Google ID Token:", idToken ? "Exists" : "Null");

      if (!idToken) {
        throw new Error(
          "Could not obtain Google ID token. Please verify your SHA-1 fingerprint in Firebase Console.",
        );
      }

      // Create a Google credential with the token
      const googleCredential = authModule.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential in Firebase
      const userCredential = await authModule().signInWithCredential(googleCredential);

      console.log("Logged in with Google Firebase:", userCredential.user.email);

      // Get Firebase ID token to authenticate with Django backend
      const firebaseIdToken = await userCredential.user.getIdToken();

      // Exchange with backend for JWT access & refresh tokens
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
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      Alert.alert("Sign In Error", error?.message || "Failed to sign in with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return { signInWithGoogle, isLoading };
}
