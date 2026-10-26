import { Redirect } from "expo-router";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/utils/authStore";

export default function IndexScreen() {
  const [authState, setAuthState] = useState(() => useAuthStore.getState());

  useEffect(() => {
    return useAuthStore.subscribe(() => {
      setAuthState({ ...useAuthStore.getState() });
    });
  }, []);

  if (authState.isLoading) {
    return null;
  }

  if (!authState.isAuthenticated) {
    return <Redirect href={"/(auth)/login"} />;
  }

  return <Redirect href={"/(tabs)/home/"} />;
}

