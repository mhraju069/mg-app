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
    //  webClientId: "", // TODO: Replace with your actual Web Client ID
    //  offlineAccess: true,
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

      // Optional: If you want to force account selection every time, you can sign out first
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore if not signed in
      }

      // Perform sign-in
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      console.log("Google ID Token:", idToken);

      if (!idToken) {
        throw new Error(
          "No ID Token found. Make sure you have configured the webClientId correctly.",
        );
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential =
        await auth().signInWithCredential(googleCredential);

      console.log("Logged in with Google:", userCredential.user.email);

      return userCredential.user;
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
