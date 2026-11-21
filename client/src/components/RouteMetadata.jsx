import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pages = {
  '/': ['LabBook — online test booking for diagnostic labs','LabBook by UnityWebWorks helps diagnostic labs offer online test booking, health checkups, booking management, and released reports.'],
  '/privacy': ['Privacy policy — LabBook','How LabBook handles booking details, contact information, reports, and notifications.'],
  '/terms': ['Terms of use — LabBook','Terms for using LabBook and booking services directly with your diagnostic lab.'],
  '/signup': ['Set up your lab — LabBook','Create an online booking page for your diagnostic lab.'],
  '/dashboard': ['Lab dashboard — LabBook','Sign in to manage your lab bookings, requests, and catalogue.'],
};
export default function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page=pages[pathname] || ['Lab tests and health checkups — LabBook','Find tests, review preparation details, and book directly with your lab.'];
    document.title=page[0];
    document.querySelector('meta[name="description"]')?.setAttribute('content',page[1]);
    const privatePage=pathname==='/dashboard'||pathname==='/signup'||pathname.endsWith('/check')||/^\/maheera(?:\/|$)/.test(pathname);
    document.querySelector('meta[name="robots"]')?.setAttribute('content',privatePage?'noindex,follow':'index,follow');
    document.querySelector('meta[property="og:title"]')?.setAttribute('content',page[0]);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content',page[1]);
    // Existing marketing consent must never follow visitors into medical routes.
    if(pathname!=='/') { try { window.fbq?.('consent','revoke'); } catch {} }
  },[pathname]);
  return null;
}
