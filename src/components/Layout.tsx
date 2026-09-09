import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-[100dvh] w-full bg-background sm:bg-muted flex flex-col items-center justify-start sm:py-8 font-body selection:bg-foreground selection:text-accent-foreground">
      {/* Website Container: 100% fluid on mobile, centered editorial column on desktop */}
      <div className={`w-full ${isAdmin ? 'sm:max-w-[560px]' : 'sm:max-w-[440px]'} min-h-[100dvh] sm:min-h-[750px] bg-background text-foreground border-0 sm:border sm:border-border flex flex-col relative overflow-x-hidden`}>
        
        {/* Top Header */}
        <header className="px-4 sm:px-6 py-3.5 sm:py-4 flex justify-between items-center bg-background shrink-0 pt-[max(0.875rem,env(safe-area-inset-top))]">
          <span className="font-display text-xl sm:text-2xl uppercase tracking-wider text-foreground">Golden Box</span>
          <span className="font-label text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-muted-foreground">EST. 1988</span>
        </header>

        <div className="w-full h-px bg-border shrink-0"></div>

        {/* Page Content */}
        <div className="flex-grow flex flex-col min-h-0 bg-background">
          <Outlet />
        </div>

        <div id="sheet-root" className="fixed inset-0 pointer-events-none z-50"></div>

        {/* Footer */}
        <div className="w-full h-px bg-border mt-auto shrink-0"></div>
        <footer className="px-4 sm:px-6 py-3 sm:py-3.5 flex flex-col gap-2.5 sm:gap-3 bg-background shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          {/* Subtle Editorial Store Location Metadata */}
          <a
            href="https://maps.app.goo.gl/YZAx756o9ag2N2n2A"
            target="_blank"
            rel="noopener noreferrer"
            className="group block text-foreground hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="Golden Box location on Google Maps (opens in new tab)"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-label text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                STORE LOCATION
              </span>
              <span className="font-label text-[9px] tracking-[0.1em] uppercase text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                OPEN IN MAPS ↗
              </span>
            </div>
            <p className="font-body text-[13px] sm:text-[14px] font-normal text-foreground leading-tight sm:leading-snug">
              7, Ground Floor, Anmol Chambers, Soni Bazar, Rajkot – 360001
            </p>
          </a>

          <div className="w-full h-px bg-border-light"></div>

          {/* Copyright & Enquiries */}
          <div className="flex justify-between items-center gap-3">
            <span className="font-label text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-foreground">
              © Golden Box
            </span>
            <div className="flex gap-3">
              <a
                href="https://wa.me/919426782765"
                className="flex items-center gap-1.5 font-label text-[9px] sm:text-[10px] tracking-[0.1em] text-foreground uppercase hover:opacity-80 transition-opacity py-1 px-2.5 border border-border bg-background"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact Golden Box on WhatsApp for enquiries"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /> Enquiries
              </a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
