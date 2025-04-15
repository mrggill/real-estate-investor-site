import './globals.css'
import ClientProvider from './ClientProvider'
import Link from 'next/link'

export const metadata = {
  title: 'Real Estate Investor Site',
  description: 'Dashboard and data for real estate investors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col cursor-pointer">
        <ClientProvider>
          <Header />
          <main className="flex-grow container mx-auto p-6">
            {children}
          </main>
          <Footer />
        </ClientProvider>
      </body>
    </html>
  )
}

function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">RE Investor</h1>
        <nav className="space-x-4">
          <Link href="/" className="hover:underline cursor-pointer">Home</Link>
          <Link href="/news" className="hover:underline cursor-pointer">News</Link>
          <Link href="/map" className="hover:underline cursor-pointer">Map</Link>
          <Link href="/login" className="hover:underline cursor-pointer">Login</Link>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-100 text-center p-4">
      <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} RE Investor</p>
    </footer>
  )
}
