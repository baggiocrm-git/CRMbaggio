import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CBSL CRM | Gestão de Engenharia e Construção',
  description: 'CRM profissional para gestão de projetos de construção, finanças e pessoal.',
};

// Root layout for the CBSL CRM application
export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              const theme = localStorage.getItem('app-theme') || 'dark';
              const fontSize = localStorage.getItem('app-font-size') || 'medium';
              
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
              
              document.documentElement.classList.add('font-' + fontSize);
            } catch (e) {}
          })();
        `}} />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
