import type { Metadata } from "next";
import { Cormorant_Garamond, Syne } from "next/font/google";
import { Grain } from "@/components/layout/Grain";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CartProvider } from "@/providers/cart-context";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Diablo Santo — Luxury Streetwear",
    template: "%s · Diablo Santo",
  },
  description:
    "Dark luxury streetwear. Cinematic silhouettes, bone and black, handcrafted tension.",
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${cormorant.variable}`}>
      <body className="font-sans">
        <CartProvider>
          <Grain />
          <Header />
          <main className="pt-14 md:pt-16">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
