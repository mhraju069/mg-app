import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";
import { STRIPE_PUBLISHABLE_KEY } from "@/utils/stripe";

export function StripeAppProvider({ children }: { children: React.ReactNode }) {
  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.saruf.heavenwellness"
    >
      <>{children}</>
    </StripeProvider>
  );
}

export default StripeAppProvider;
