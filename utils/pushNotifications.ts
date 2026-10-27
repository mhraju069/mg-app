import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { API_BASE_URL } from "./constants";
import { useAuthStore } from "./authStore";
import Constants from "expo-constants";
import { router } from "expo-router";

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let isRegistering = false;

/**
 * Register push notification token with backend
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isRegistering) return null;
  isRegistering = true;

  try {
    if (!Device.isDevice) {
      console.log("Push notifications require a physical device.");
      return null;
    }

    // Android channel configuration
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#9F634A",
      });
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission for push notifications was not granted.");
      return null;
    }

    // Prefer Device Push Token (FCM on Android / APNs on iOS)
    let pushToken: string | null = null;
    try {
      const deviceTokenResult = await Notifications.getDevicePushTokenAsync();
      pushToken = deviceTokenResult.data;
    } catch (e) {
      console.warn("Could not retrieve native device token, trying Expo push token:", e);
    }

    // Fallback to Expo Push Token if device push token fails
    if (!pushToken) {
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;
        const expoTokenResult = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        pushToken = expoTokenResult.data;
      } catch (err) {
        console.warn("Could not retrieve expo push token:", err);
      }
    }

    if (!pushToken) {
      return null;
    }

    // Send token to backend if user is authenticated
    await sendDeviceTokenToBackend(pushToken);

    return pushToken;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  } finally {
    isRegistering = false;
  }
}

/**
 * Send device token to backend API: POST /api/notify/register-device/?token=<token>
 */
export async function sendDeviceTokenToBackend(pushToken: string): Promise<boolean> {
  const auth = useAuthStore.getState();
  if (!auth.accessToken) {
    return false;
  }

  try {
    const encodedToken = encodeURIComponent(pushToken);
    const url = `${API_BASE_URL}/notify/register-device/?token=${encodedToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({ token: pushToken }),
    });

    if (res.ok) {
      console.log("Push notification device token registered with backend successfully.");
      return true;
    } else {
      const errData = await res.json().catch(() => null);
      console.warn("Failed to register device token with backend:", res.status, errData);
      return false;
    }
  } catch (err) {
    console.warn("Network error registering device token with backend:", err);
    return false;
  }
}

/**
 * Handles navigation or deep linking when user clicks/taps on a notification
 */
export function handleNotificationResponse(response: Notifications.NotificationResponse) {
  try {
    const data: any = response?.notification?.request?.content?.data;
    if (!data) return;

    const link = data.link;
    const bookingId = data.booking_id;

    if (link && typeof link === "string") {
      const sanitized = link.startsWith("/") ? link : `/${link}`;
      router.push(sanitized as any);
    } else if (bookingId) {
      router.push(`/bookings/${bookingId}` as any);
    } else {
      router.push("/notifications" as any);
    }
  } catch (error) {
    console.warn("Error handling notification response tap:", error);
  }
}
