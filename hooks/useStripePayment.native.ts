import { useStripe } from "@stripe/stripe-react-native";

export interface MobileBillingDetails {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    postalCode?: string;
    city?: string;
    country?: string;
    line1?: string;
  };
}

export function useStripePayment() {
  const { confirmPayment } = useStripe();

  const confirmMobilePayment = async (
    clientSecret: string,
    billingDetails?: MobileBillingDetails
  ): Promise<{ success: boolean; paymentIntent?: any; error?: string }> => {
    try {
      if (!clientSecret) {
        return {
          success: false,
          error: "Invalid payment session. Missing client secret.",
        };
      }

      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: "Card",
        paymentMethodData: {
          billingDetails: {
            name: billingDetails?.name,
            email: billingDetails?.email,
            phone: billingDetails?.phone,
            address: billingDetails?.address,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.localizedMessage || error.message || "Payment authorization failed.",
        };
      }

      return {
        success: true,
        paymentIntent,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "An unexpected error occurred during mobile payment.",
      };
    }
  };

  return { confirmMobilePayment };
}

export default useStripePayment;
