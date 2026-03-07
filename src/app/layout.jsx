import './globals.css'
import Providers from '@/components/Providers'

export const metadata = {
  title: 'Credence Realtor - Dubai Real Estate',
  description: 'Find the right property in Dubai - Backed by Insight, Not Guesswork',
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-white" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
