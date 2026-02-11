import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Hamburguesería Premium - Delivery",
  description: "Las mejores hamburguesas gourmet, directo a tu puerta. Ordena ahora y disfruta de sabores únicos.",
  keywords: ["hamburguesas", "delivery", "comida", "gourmet", "premium"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} antialiased bg-zinc-950 text-white`}>
        {children}
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#fff',
              border: '1px solid #27272a',
            },
          }}
        />
      </body>
    </html>
  );
}
