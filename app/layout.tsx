import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "AI Character Galaxy",
    template: "%s | AI Character Galaxy",
  },
  description:
    "Explore evidence-grounded relationships in history and literature through an interactive learning galaxy.",
  applicationName: "AI Character Galaxy",
  keywords: [
    "education",
    "history",
    "literature",
    "relationship map",
    "GPT-5.6",
    "OpenAI Build Week",
  ],
  authors: [{ name: "AI Character Galaxy contributors" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "AI Character Galaxy",
    description:
      "Explore why relationships mattered through evidence-grounded history and literature galaxies.",
    siteName: "AI Character Galaxy",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "AI Character Galaxy evidence-grounded learning map",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Character Galaxy",
    description:
      "Explore history and literature as evidence-grounded relationship galaxies.",
    images: ["/og-image.svg"],
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#070811",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
