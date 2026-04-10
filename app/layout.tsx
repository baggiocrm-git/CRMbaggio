import { Inter } from 'next/font/google'
import './globals.css'
import { FirebaseProvider } from './lib/FirebaseProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const themeBootScript = `
    try {
      var savedTheme = localStorage.getItem('app-theme') || 'dark';
      var savedFontSize = localStorage.getItem('app-font-size') || 'medium';
      var root = document.documentElement;
      root.classList.remove('dark', 'light', 'font-small', 'font-medium', 'font-large');
      root.classList.add(savedTheme === 'light' ? 'light' : 'dark');
      root.classList.add('font-' + savedFontSize);
    } catch (e) {}
  `;

  return (
    <html lang="pt-BR" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
      </body>
    </html>
  )
}
