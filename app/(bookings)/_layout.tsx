import { Stack } from "expo-router";
import React from "react";

export default function BookingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{ title: "Select Service", headerShown: false }}
      />
      <Stack.Screen name="[category]" options={{ title: "Services" }} />
      <Stack.Screen
        name="service/[id]"
        options={{ title: "Service Details" }}
      />
      <Stack.Screen name="select-date" options={{ title: "Select Date" }} />
      <Stack.Screen name="select-time" options={{ title: "Select Time" }} />
      <Stack.Screen name="guests" options={{ title: "Number of Guests" }} />
      <Stack.Screen
        name="information"
        options={{ title: "Your Information" }}
      />
      <Stack.Screen
        name="confirmation"
        options={{ title: "Confirm Booking" }}
      />
    </Stack>
  );
}
