import { Flame, Sparkles, Users, Utensils } from "lucide-react-native";

export const FAQ = [
  {
    id: "1",
    title: "How to book and Sauna?",
    content: "alsdkjflsdjlf",
  },
  {
    id: "2",
    title: "Can I cancel a booking?",
    content: "Yes, you can cancel a booking within 24 hours",
  },
  {
    id: "3",
    title: "Can you explain what Heaven is?",
    content: "lasdjflksdjfldsj",
  },
  {
    id: "4",
    title: "Is my data safe",
    content: "asldkjfjlsdfj",
  },
];

export const CATEGORIES = [
  {
    id: "sauna",
    title: "Sauna & Wellness",
    subtitle: "Heat. Release. Renew.",
    image: require("@/assets/images/sauna.png"),
    icon: Flame,
  },
  {
    id: "arrangements",
    title: "Arrangements",
    subtitle: "Curated journeys of renewal",
    image: require("@/assets/images/arrangements.jpg"),
    icon: Sparkles,
  },
  {
    id: "lunchroom",
    title: "Lunchroom",
    subtitle: "Nourishment for body and soul",
    image: require("@/assets/images/lunchroom.png"),
    icon: Utensils,
  },
  {
    id: "activities",
    title: "Activities",
    subtitle: "Movement. Breath. Flow.",
    image: require("@/assets/images/activities.jpg"),
    icon: Users,
  },
];

export const CATEGORY_DATA: Record<string, any> = {
  sauna: {
    title: "Sauna & Wellness",
    subtitle: "Heat. Release. Renew.",
    services: [
      {
        id: "private-sauna",
        title: "Private Sauna",
        description:
          "Your own exclusive sanctuary for ultimate privacy and relaxation.",
        rating: 4.9,
        capacity: "Up to 6 persons",
        duration: "2-hour sessions",
        requirement: "Prepayment required",
        price: 210,
        image:
          "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=2070&auto=format&fit=crop",
      },
      {
        id: "wellness-pool",
        title: "Heated Wellness Pool",
        description:
          "Serenity in every stroke. Experience the warmth of our thermal waters.",
        rating: 4.8,
        capacity: "Up to 10 persons",
        duration: "1-hour sessions",
        requirement: "Booking required",
        price: 45,
        image:
          "https://images.unsplash.com/photo-1576013551627-0cc20b96862c?q=80&w=2070&auto=format&fit=crop",
      },
    ],
  },
  arrangements: {
    title: "Arrangements",
    subtitle: "Curated journeys of renewal",
    services: [
      {
        id: "wellness-escape",
        title: "Wellness Escape",
        description:
          "Sauna + Massage + Lunch. A complete day of relaxation combining our finest wellness services.",
        rating: 4.9,
        capacity: "2-4 people",
        duration: "6-hour duration",
        requirement: "Full prepayment",
        price: 210,
        image:
          "https://images.unsplash.com/photo-1544161515-436cefd54cbf?q=80&w=2070&auto=format&fit=crop",
      },
    ],
  },
  activities: {
    title: "Activities",
    subtitle: "Movement. Breath. Flow.",
    services: [
      {
        id: "yoga",
        title: "Morning Flow Yoga",
        description:
          "Find your center with guided movement in our serenity studio.",
        rating: 4.9,
        capacity: "12 people",
        duration: "8:00 AM - 9:00 AM",
        requirement: "Movement Studio",
        price: 40,
        image:
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2070&auto=format&fit=crop",
      },
    ],
  },
  lunchroom: {
    title: "Lunchroom",
    subtitle: "Nourishment for body and soul",
    services: [
      {
        id: "lunch-exp",
        title: "Lunchroom Experience",
        description: "Seasonal, organic cuisine. Payment at location.",
        rating: 4.8,
        capacity: "1-6 people",
        duration: "120 minutes",
        requirement: "Table reservation",
        price: 0,
        isFree: true,
        image:
          "https://images.unsplash.com/photo-1547573854-74d2a71d0826?q=80&w=2070&auto=format&fit=crop",
      },
    ],
  },
};

export const TIME_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

export const upcomingBookings = [
  {
    id: "1",
    title: "Private Sauna",
    category: "Private Sauna",
    date: "15 Feb 2026",
    time: "10:00 AM",
    guests: "2 guests",
    paymentStatus: "Paid",
    status: "Upcoming",
    type: "sauna",
  },
  {
    id: "2",
    title: "Lunchroom Reservation",
    category: "Restaurant",
    date: "20 Feb 2026",
    time: "1:00 AM",
    guests: "4 guests",
    paymentStatus: "Pay on arrival",
    status: "Upcoming",
    type: "launchroom",
  },
  {
    id: "2",
    title: "Lunchroom Reservation",
    category: "Restaurant",
    date: "20 Feb 2026",
    time: "1:00 AM",
    guests: "4 guests",
    paymentStatus: "Pay on arrival",
    status: "Upcoming",
    type: "launchroom",
  },
  {
    id: "2",
    title: "Lunchroom Reservation",
    category: "Restaurant",
    date: "20 Feb 2026",
    time: "1:00 AM",
    guests: "4 guests",
    paymentStatus: "Pay on arrival",
    status: "Upcoming",
    type: "launchroom",
  },
  {
    id: "2",
    title: "Lunchroom Reservation",
    category: "Restaurant",
    date: "20 Feb 2026",
    time: "1:00 AM",
    guests: "4 guests",
    paymentStatus: "Pay on arrival",
    status: "Upcoming",
    type: "launchroom",
  },
];

export const formatImageUrl = (
  imageSrc: string | null | undefined,
  fallback?: string
): string => {
  if (!imageSrc) return fallback || "";
  if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://") || imageSrc.startsWith("file://") || imageSrc.startsWith("blob:") || imageSrc.startsWith("data:")) {
    return imageSrc;
  }
  const cleanPath = imageSrc.startsWith("/") ? imageSrc : `/${imageSrc}`;
  return `http://localhost${cleanPath}`;
};
