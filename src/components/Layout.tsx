import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center sm:py-8 font-body selection:bg-foreground selection:text-accent-foreground">
      {/* Mobile Canvas Container */}
      <div className="w-full max-w-[400px] min-h-[100dvh] sm:min-h-0 sm:h-auto sm:min-h-[750px] bg-background text-foreground sm:border sm:border-border flex flex-col relative overflow-hidden">
        
        {/* Top Header */}
        <header className="px-6 py-4 flex justify-between items-center bg-background shrink-0">
          <span className="font-display text-xl uppercase tracking-wider text-foreground">Golden Box</span>
          <span className="font-label text-[9px] tracking-[0.2em] uppercase text-muted-foreground">EST. 1988</span>
        </header>

        <div className="w-full h-px bg-border shrink-0"></div>

        {/* Page Content */}
        <div className="flex-grow flex flex-col overflow-hidden bg-background">
          <Outlet />
        </div>

        <div id="sheet-root" className="absolute inset-0 pointer-events-none z-50"></div>
        {/* Footer */}
        <div className="w-full h-px bg-border mt-auto shrink-0"></div>
        <footer className="px-6 py-4 flex justify-between items-center bg-background shrink-0">
          <span className="font-label text-[9px] tracking-[0.2em] uppercase text-foreground">© Golden Box</span>
          <div className="flex gap-4">
            <a href="https://wa.me/919426782765" className="flex items-center gap-1 font-label text-[9px] tracking-[0.1em] text-muted-foreground uppercase hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-3 h-3 text-[#25D366]" /> Enquiries
            </a>
          </div>
        </footer>

      </div>
    </div>
  );
}
