import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const coconutSans = DM_Sans({
  variable: "--font-coconut-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const coconutDisplay = DM_Serif_Display({
  variable: "--font-coconut-display",
  subsets: ["latin"],
  weight: ["400"],
});

const coconutMono = JetBrains_Mono({
  variable: "--font-coconut-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Coconut CRM",
  description: "Operations dashboard for customer, staff, and task management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${coconutSans.variable} ${coconutDisplay.variable} ${coconutMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
