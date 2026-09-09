import React from 'react';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [authError, setAuthError] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/admin/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data.user);
        fetchDashboard();
      } else {
        setSession(null);
      }
    } catch (e) {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        checkSession();
      } else {
        setAuthError(data.error || 'Invalid credentials');
      }
    } catch (e: any) {
      setAuthError('Connection error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    setDashboardData(null);
  };

  if (loading) {
    return (
      <main className="flex-grow flex flex-col relative bg-background text-foreground items-center justify-center p-6">
        <p className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex-grow flex flex-col relative bg-background text-foreground items-center justify-center p-6">
        <div className="w-full max-w-[280px]">
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl uppercase tracking-tight mb-2 text-foreground">Admin Panel</h1>
            <p className="font-body text-sm text-muted-foreground">
              Secure area. Authorized personnel only.
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border-b border-border py-2 font-body text-sm outline-none focus:border-b-2 focus:border-border transition-all bg-transparent rounded-none text-foreground"
                required
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-label text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-b border-border py-2 font-body text-sm outline-none focus:border-b-2 focus:border-border transition-all bg-transparent rounded-none text-foreground"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loginLoading}
              className="mt-4 bg-foreground text-accent-foreground px-8 py-4 font-label text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors w-full disabled:opacity-50 border border-border rounded-none cursor-pointer"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {authError && (
            <p className="font-body text-xs text-red-500 mt-6 text-center leading-relaxed">
              {authError}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow flex flex-col p-6 relative bg-background text-foreground">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-tight mb-2 text-foreground">Admin Dashboard</h1>
          <p className="font-label text-[10px] uppercase tracking-widest text-muted-foreground">Welcome, {session.name || session.email}</p>
        </div>
        <button onClick={handleLogout} className="font-label text-[10px] tracking-[0.2em] uppercase text-foreground hover:underline underline-offset-4 cursor-pointer">
          Logout
        </button>
      </div>

      {dashboardData ? (
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="border border-border p-4 flex flex-col items-center justify-center text-center bg-background">
            <span className="font-display text-4xl text-foreground">{dashboardData.categoriesCount}</span>
            <span className="font-label text-[9px] uppercase tracking-widest text-muted-foreground mt-2">Categories</span>
          </div>
          <div className="border border-border p-4 flex flex-col items-center justify-center text-center bg-background">
            <span className="font-display text-4xl text-foreground">{dashboardData.productsCount}</span>
            <span className="font-label text-[9px] uppercase tracking-widest text-muted-foreground mt-2">Total Products</span>
          </div>
          <div className="border border-border p-4 flex flex-col items-center justify-center text-center col-span-2 bg-background">
            <span className="font-display text-4xl text-foreground">{dashboardData.activeProductsCount}</span>
            <span className="font-label text-[9px] uppercase tracking-widest text-muted-foreground mt-2">Active Products</span>
          </div>
        </div>
      ) : (
        <div className="flex justify-center mb-10">
          <p className="font-label text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Loading stats...</p>
        </div>
      )}

      <div className="flex flex-col gap-4 border-t border-border pt-8">
        <h2 className="font-label text-xs font-bold tracking-[0.2em] uppercase mb-2 text-foreground">Management</h2>
        
        <button 
          onClick={() => window.location.href = '/admin/categories'}
          className="w-full border border-border p-4 flex justify-between items-center hover:bg-foreground hover:text-accent-foreground transition-colors cursor-pointer group bg-background rounded-none"
        >
          <span className="font-label text-[10px] font-bold tracking-[0.2em] uppercase">Manage Categories</span>
          <span className="font-label text-[8px] uppercase tracking-widest text-muted-foreground group-hover:text-accent-foreground">Open &rarr;</span>
        </button>

        <button 
          onClick={() => window.location.href = '/admin/products'}
          className="w-full border border-border p-4 flex justify-between items-center hover:bg-foreground hover:text-accent-foreground transition-colors cursor-pointer group bg-background rounded-none"
        >
          <span className="font-label text-[10px] font-bold tracking-[0.2em] uppercase">Manage Products</span>
          <span className="font-label text-[8px] uppercase tracking-widest text-muted-foreground group-hover:text-accent-foreground">Open &rarr;</span>
        </button>
        <p className="font-label text-[8px] uppercase tracking-widest text-center text-muted-foreground mt-4">
          Changes made here reflect immediately in the customer catalog.
        </p>
      </div>
    </main>
  );
}
