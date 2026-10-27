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
  const confirmMobilePayment = async (
    _clientSecret: string,
    _billingDetails?: MobileBillingDetails
  ): Promise<{ success: boolean; paymentIntent?: any; error?: string }> => {
    return {
      success: false,
      error: "Mobile native payment is not supported on web. Please use web Elements.",
    };
  };

  return { confirmMobilePayment };
}

export default useStripePayment;
