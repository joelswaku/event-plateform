export const metadata = {
  title: "Customer Reviews - LiteEvent",
  description: "Read what our customers are saying about LiteEvent. See verified reviews and ratings from event organizers who trust our platform.",
  keywords: "LiteEvent reviews, customer reviews, event management reviews, event platform ratings",
  openGraph: {
    title: "Customer Reviews - LiteEvent",
    description: "Read what our customers are saying about LiteEvent. Verified reviews and ratings from event organizers.",
    url: "https://liteevent.com/reviews",
    type: "website",
    images: [
      {
        url: "https://liteevent.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "LiteEvent Reviews"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Customer Reviews - LiteEvent",
    description: "Read what our customers are saying about LiteEvent",
    images: ["https://liteevent.com/og-image.png"]
  }
};

export default function ReviewsLayout({ children }) {
  return children;
}
