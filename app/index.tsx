import { Redirect } from "expo-router";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/utils/authStore";

export default function IndexScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => useAuthStore.getState().isAuthenticated);

  useEffect(() => {
    return useAuthStore.subscribe(() => {
      setIsAuthenticated(useAuthStore.getState().isAuthenticated);
    });
  }, []);

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/login"} />;
  }

  return <Redirect href={"/(tabs)/home/"} />;
}

