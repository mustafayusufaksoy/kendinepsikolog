import './globals.css'
import { Analytics } from "@vercel/analytics/react"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className='dark'>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}