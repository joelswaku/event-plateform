export const metadata = {
  title: "Customer Reviews - LiteEvent | Event Management Software Reviews",
  description: "Read verified reviews of LiteEvent - the best event management software for weddings, conferences, and festivals. Event ticketing platform with QR code check-in, RSVP management, and online ticket sales.",
  keywords: "event management software, event ticketing platform, online event ticket sales, RSVP management software, wedding RSVP website, wedding invitation website, wedding ticketing platform, conference registration software, festival ticketing software, QR code event check-in, event check-in app, sell event tickets online, free event management software, event management reviews, customer reviews",
  openGraph: {
    title: "Customer Reviews - LiteEvent | Event Management Software",
    description: "See why event organizers love LiteEvent. Reviews for our event ticketing platform, RSVP management, and QR code check-in system.",
    url: "https://liteevent.com/reviews",
    type: "website",
    images: [
      {
        url: "https://liteevent.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "LiteEvent Reviews - Event Management Software"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Customer Reviews - LiteEvent | Event Ticketing Platform",
    description: "Read reviews from event organizers using our event management and ticketing platform",
    images: ["https://liteevent.com/og-image.png"]
  }
};

export default function ReviewsLayout({ children }) {
  return children;
}
