import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "SelfOS Hub",
  description: "MVP personal productivity web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">{children}</body>
    </html>
  );
}
