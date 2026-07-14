import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI Character Galaxy",
    template: "%s | AI Character Galaxy",
  },
  description:
    "Explore evidence-grounded relationships in history and literature through an interactive learning galaxy.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#070811",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
