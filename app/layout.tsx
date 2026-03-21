import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

import DebugBanner from '@/components/DebugBanner';

export const metadata: Metadata = {
  title: 'CBSL ERP v4.1 | Gestão Profissional',
  description: 'Sistema de Gestão de Engenharia e Construção - Versão 4.1',
};

// Root layout for the CBSL CRM application - Cache Buster v4.3
export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              const currentVersion = '20260321-0630';
              const storedVersion = localStorage.getItem('app-version-v4');
              
              console.log('RootLayout: Iniciando v4.4 - Versão:', currentVersion);
              
              if (storedVersion !== currentVersion) {
                console.warn('Versão antiga ou cache detectado. Limpando tudo...');
                localStorage.clear();
                sessionStorage.clear();
                localStorage.setItem('app-version-v4', currentVersion);
                
                // Clear all cookies
                document.cookie.split(";").forEach(function(c) { 
                  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                });
                
                // Try to unregister all service workers
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      registration.unregister();
                    }
                  });
                }
                
                console.log('Limpeza concluída. Recarregando página...');
                window.location.reload();
                return;
              }
              
              const theme = localStorage.getItem('app-theme') || 'dark';
              const fontSize = localStorage.getItem('app-font-size') || 'medium';
              
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
              
              document.documentElement.classList.add('font-' + fontSize);
            } catch (e) {
              console.error('Erro no script de cache-buster:', e);
            }
          })();
        `}} />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <DebugBanner />
        {children}
      </body>
    </html>
  );
}
