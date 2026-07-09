import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Meter Note",
  description: "Save a 1-10 score with a short note, wallet, and timestamp on Base for demos, reviews, and quick feedback.",
};

const configuredBaseAppId = process.env.NEXT_PUBLIC_BASE_APP_ID?.trim();
const baseAppId =
  configuredBaseAppId && !configuredBaseAppId.includes("replace_with")
    ? configuredBaseAppId
    : "6a0b28f9e317310c39c9c1fa";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>{baseAppId ? <meta name="base:app_id" content={baseAppId} /> : null}</head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
