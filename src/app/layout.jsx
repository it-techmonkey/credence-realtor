import './globals.css'
import dynamic from 'next/dynamic'

const ClientLayout = dynamic(() => import('@/components/ClientLayout'), {
  ssr: true,
  loading: () => <div className="flex flex-col min-h-screen bg-white" />,
})

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
      <body className="flex flex-col min-h-screen bg-white">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
