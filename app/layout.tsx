import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: { default: 'PanaX Control Room · Apex Finance', template: '%s · PanaX Control Room' },
  description: 'Institutional Back Office & Multi-Currency Control Room — Apex Finance',
  icons: { icon: '/paces/images/favicon.ico' },
};

/* Applied before first paint: restores Paces theme and layout attributes with clean light sidebar */
const THEME_INIT = `(function(){try{
var t=localStorage.getItem('pacesTheme')||'light';
document.documentElement.setAttribute('data-bs-theme',t);
var s=localStorage.getItem('pacesSidenavSize')||'default';
document.documentElement.setAttribute('data-sidenav-size',s);
document.documentElement.setAttribute('data-menu-color','light');
document.documentElement.setAttribute('data-topbar-color','light');
}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-bs-theme="light" data-menu-color="light" data-topbar-color="light" data-sidenav-size="default">
      <head>
        <link rel="stylesheet" href="/paces/css/vendors.min.css" />
        <link rel="stylesheet" href="/paces/css/app.min.css" />
        <link rel="stylesheet" href="/paces/css/exchange.css" />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
