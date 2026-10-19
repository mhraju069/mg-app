import { Linking, Alert } from "react-native";

type ContactType = "call" | "whatsapp" | "email";

interface ContactOptions {
  type: ContactType;
  value?: string;        // phone or email
  subject?: string;     // for email
  body?: string;        // for email
  message?: string;     // for whatsapp
}

export const openContact = async (options: ContactOptions | ContactType) => {
  const type = typeof options === 'string' ? options : options.type;
  const value = (typeof options === 'object' && options.value) || "+1234567890";
  const message = (typeof options === 'object' && options.message) || "Hello, I have a booking question.";
  const subject = (typeof options === 'object' && options.subject) || "Booking Inquiry";
  const body = (typeof options === 'object' && options.body) || "Hi, I need help with my booking.";

  let url = "";

  switch (type) {
    case "call":
      url = `tel:${value}`;
      break;

    case "whatsapp":
      const formattedPhone = value.replace(/\D/g, "");
      const text = message
        ? `?text=${encodeURIComponent(message)}`
        : "";
      url = `https://wa.me/${formattedPhone}${text}`;
      break;

    case "email":
      url = `mailto:${value}?subject=${encodeURIComponent(
        subject || ""
      )}&body=${encodeURIComponent(body || "")}`;
      break;

    default:
      console.warn("Unknown contact type:", type);
      return;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // In some cases (simulators), canOpenURL returns false even if openURL might work or fail gracefully
      // On real devices, it usually works if the app is installed.
      if (type === "whatsapp") {
        // Fallback for whatsapp if the direct link fails
        const fallbackUrl = `https://api.whatsapp.com/send?phone=${value.replace(/\D/g, "")}`;
        await Linking.openURL(fallbackUrl);
      } else {
        Alert.alert("Notice", "This action is not supported on this device (e.g., no SIM card or app not installed).");
      }
    }
  } catch (error) {
    console.error("Error opening contact URL:", error);
    Alert.alert("Error", "An unexpected error occurred while trying to open the contact method.");
  }
};
