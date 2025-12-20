import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secret Message",
  description: "Create and share anonymous, encrypted secret messages",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
