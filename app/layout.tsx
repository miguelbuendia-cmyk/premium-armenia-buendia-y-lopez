import type { Metadata } from "next"
import { Cormorant_Garamond, Geist_Mono, Manrope } from "next/font/google"

import { cn } from "@/lib/utils"

import "./globals.css"

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-editorial",
})

const sansFont = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
})

const monoFont = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Premium Armenia Buendía y López",
  description:
    "Micrositio editorial con vista 360 para presentar Premium Armenia Buendía y López.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={cn(
        "h-full",
        "antialiased",
        displayFont.variable,
        sansFont.variable,
        monoFont.variable,
        "font-sans"
      )}
    >
      <body className="min-h-full font-sans text-foreground">
        {children}
      </body>
    </html>
  )
}
