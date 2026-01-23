import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import type { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})


export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Session is now synced with all requests
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className={inter.variable}>
      <Component {...pageProps} />
    </div>
  )
}