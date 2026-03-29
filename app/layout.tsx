import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Dancing_Script } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Navbar } from '@/components/navbar'
import { InkSplatters } from '@/components/ink-splatters'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const dancingScript = Dancing_Script({ 
  subsets: ["latin"], 
  weight: "700",
  variable: "--font-dancing" 
})

export const metadata: Metadata = {
  title: {
    default: 'Inkbound Books',
    template: '%s - Inkbound Books',
  },
  description: 'A small team dedicated to writing and editing quality e-books',
  // VULN-04: removed generator: 'v0.app' — no need to advertise the builder
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f1a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dancingScript.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          storageKey="inkbound-theme"
        >
          <InkSplatters />
          <Navbar />
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}