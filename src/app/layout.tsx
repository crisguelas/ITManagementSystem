import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

// Use Inter font as specified in our design system
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-gray-900 min-h-screen antialiased">
        {/* ToastProvider wraps the entire app allowing toasts from anywhere */}
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
