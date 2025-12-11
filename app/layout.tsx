import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers";
import { CartProvider } from "@/context/cart-context";
import { ViewHistoryProvider } from "@/context/view-history-context";
import { Toaster } from "@/components/ui/toaster";
import { FloatingCallButton } from "@/components/floating-call-button";
import { ScrollToTop } from "@/components/scroll-to-top";
import { NavigationProgress } from "@/components/navigation-progress";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Genito Fashion - Quality Products for Every Style",
  description:
    "Shop for shoes, clothes, perfumes, chains and more at Genito Fashion in Cameroon.",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <ViewHistoryProvider>
                <ScrollToTop />
                <Suspense fallback={null}>
                  <NavigationProgress />
                </Suspense>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <div className="flex-1 w-full">{children}</div>
                  <Footer />
                  <FloatingCallButton />
                </div>
                <Toaster />
              </ViewHistoryProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
