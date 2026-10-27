import { ToastProvider } from "@/components/ui/toast";
import { useColor } from "@/hooks/useColor";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/theme/colors";
import { ThemeProvider } from "@/theme/theme-provider";
import { osName } from "expo-device";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { setBackgroundColorAsync } from "expo-system-ui";
import React, { useEffect } from "react";
import { LogBox, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import "@/i18n";

import { notificationStore } from "@/utils/notificationStore";
import { useAuthStore } from "@/utils/authStore";
import { StripeAppProvider } from "@/providers/StripeAppProvider";

LogBox.ignoreAllLogs();

SplashScreen.setOptions({
  duration: 200,
  fade: true,
});

export default function RootLayout() {
  const colorScheme = useColorScheme() || "light";
  const primary = useColor("primary");

  useEffect(() => {
    // 1. Initial notification fetch and WebSocket listener
    const initNotifications = () => {
      const auth = useAuthStore.getState();
      if (auth.accessToken) {
        notificationStore.fetchUnreadCount();
        notificationStore.connectWebSocket();
      } else {
        notificationStore.disconnectWebSocket();
      }
    };

    initNotifications();

    // Re-check on auth state change
    const unsubscribeAuth = useAuthStore.subscribe(() => {
      initNotifications();
    });

    return () => {
      unsubscribeAuth();
      notificationStore.disconnectWebSocket();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setButtonStyleAsync(
        colorScheme === "light" ? "dark" : "light",
      );
    }
  }, [colorScheme]);

  useEffect(() => {
    setBackgroundColorAsync(
      // colorScheme === "dark"
      // ? Colors.dark.background
      // :
       Colors.light.background,
    );
  }, [colorScheme]);

  return (
    <SafeAreaProvider>
      {/* <SafeAreaView style={{ flex: 1 }}> */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StripeAppProvider>
          <ThemeProvider>
            <StatusBar style={
              // colorScheme === "dark"
              // ? "light"
              // :
              "dark"
              } animated />

            <ToastProvider>

            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(bookings)" options={{ headerShown: false }} />

              <Stack.Screen
                name="sheet"
                options={{
                  headerShown: false,
                  sheetGrabberVisible: true,
                  sheetAllowedDetents: [0.4, 0.7, 1],
                  contentStyle: {
                    backgroundColor: isLiquidGlassAvailable()
                      ? "transparent"
                    //   : colorScheme === "dark"
                    //     ? Colors.dark.card
                        : Colors.light.card,
                  },
                  headerTransparent: Platform.OS === "ios" ? true : false,
                  headerLargeTitle: false,
                  title: "",
                  presentation:
                    Platform.OS === "ios"
                      ? isLiquidGlassAvailable() && osName !== "iPadOS"
                        ? "formSheet"
                        : "modal"
                      : "modal",
                  sheetInitialDetentIndex: 0,
                  headerStyle: {
                    backgroundColor:
                      Platform.OS === "ios"
                        ? "transparent"
                        : // colorScheme === "dark"
                          //   ? Colors.dark.card
                          //   :
                           Colors.light.card,
                  },
                  headerBlurEffect: isLiquidGlassAvailable()
                    ? undefined
                    // : colorScheme === "dark"
                    //   ? "dark"
                      : "light",
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
            <Toaster
              position="bottom-center"
              swipeToDismissDirection="left"
              richColors
              toastOptions={{
                style: {
                  borderWidth: 0,
                },
                success: { backgroundColor: primary },
                // warning: { backgroundColor: colors.dark.warning },
                // error: { backgroundColor: colors.dark.danger },
                titleStyle: { color: "#fff" },
              }}
            />
            </ToastProvider>
          </ThemeProvider>
        </StripeAppProvider>
      </GestureHandlerRootView>
      {/* </SafeAreaView> */}
    </SafeAreaProvider>
  );
}
