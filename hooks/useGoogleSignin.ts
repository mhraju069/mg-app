import auth from "@react-native-firebase/auth";
import {
  statusCodes,
  isErrorWithCode,
  GoogleSignin,
} from "@react-native-google-signin/google-signin";
import { useState } from "react";

import { Platform } from "react-native";

// Note: You should replace this webClientId with your own from the Google Cloud Console / Firebase Console
// It's the client ID associated with the Web client type.
if (Platform.OS !== "web") {
  GoogleSignin.configure({
    scopes: ["email", "profile"],
    webClientId: "924899435325-bl41d05ebdietd882sdta3tj1k8joo9r.apps.googleusercontent.com",
    offlineAccess: true,
  });
}

export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Check if device has Google Play Services
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Optional: force fresh account picker
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore if not signed in
      }

      // Perform sign-in (In @react-native-google-signin v13+, signIn() returns SignInResponse)
      const signInResult = await GoogleSignin.signIn();
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
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }

      console.log("Resolved Google ID Token:", idToken ? "Exists" : "Null");

      if (!idToken) {
        throw new Error(
          "Could not obtain Google ID token. Please verify your SHA-1 fingerprint in Firebase Console.",
        );
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential in Firebase
      const userCredential =
        await auth().signInWithCredential(googleCredential);

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
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log("User cancelled the login flow");
            break;
          case statusCodes.IN_PROGRESS:
            console.log("Operation is in progress already");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.log("Play services not available or outdated");
            break;
          default:
            console.log("An unknown error occurred:", error);
            break;
        }
      } else {
        console.error(
          "An unexpected error occurred during Google Sign-In:",
          error,
        );
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { signInWithGoogle, isLoading };
}
