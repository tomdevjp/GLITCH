"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '../../store';
import { Layout, MessageSquare, Sparkles, Gem, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { plan } = useAppStore();

  const menuItems = [
    { name: 'Forms', href: '/dashboard', icon: Layout },
    { name: 'Responses', href: '/dashboard/responses', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-zinc-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800/60 bg-[#09090b] flex flex-col flex-shrink-0 z-20">
        {/* Header Logo */}
        <div className="h-16 px-6 border-b border-zinc-800/60 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-black text-base tracking-[0.12em] text-zinc-100 uppercase" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
              GLI<span className="text-emerald-400">TCH</span>
            </span>
          </Link>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-mono">Hub</span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            // Forms (/dashboard) と Responses (/dashboard/responses) の isActive 判定
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard' || pathname?.startsWith('/dashboard/forms')
              : pathname === item.href || pathname?.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive 
                    ? 'bg-zinc-900 text-emerald-400 border border-zinc-800 shadow-sm shadow-emerald-500/5' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Panel */}
        <div className="p-4 border-t border-zinc-800/60 flex flex-col gap-3">
          {/* Plan badge */}
          <div className="bg-zinc-900/50 border border-zinc-800/60 p-3 rounded-lg flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Current Plan</span>
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                {plan === 'free' ? 'Free Tier' : 'Pro Member'}
              </span>
            </div>
            {plan === 'pro' && (
              <div className="w-6 h-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded">
                <Gem className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-400 hover:text-white uppercase tracking-widest font-bold border border-zinc-800 rounded transition-all"
          >
            <LogOut className="w-3 h-3" /> Back to Builder
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col bg-[#09090b]">
        {children}
      </main>
    </div>
  );
}
