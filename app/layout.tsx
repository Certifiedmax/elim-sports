import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Elim Sports - Official Court Gear & Equipment",
  description: "Yonex badminton rackets, shuttles, and court shoes in Juja.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>
            {children}
            <CartDrawer />
            <Analytics />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}