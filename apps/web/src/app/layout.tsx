import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Fieldhouse — Youth Sports, All In One Place",
  description:
    "League management platform for youth sports: messaging, stats, schedules, and moderation.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#F8FAFC] min-h-screen font-sans antialiased">
        <div>{children}</div>
      </body>
    </html>
  )
}
