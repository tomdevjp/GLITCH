"use client";

import React from 'react';
import { BuilderSidebar } from '../components/BuilderSidebar';
import { Renderer } from '../components/Renderer';
import { useAppStore } from '../store';

export default function App() {
  const { formConfig } = useAppStore();
  const [device, setDevice] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const getDeviceWidth = () => {
    switch (device) {
      case 'mobile': return 'max-w-[375px]';
      case 'tablet': return 'max-w-[768px]';
      case 'desktop': return 'w-full';
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 overflow-hidden text-zinc-100 font-sans">
      {/* Sidebar Panel for Builder */}
      <div className="w-80 flex-shrink-0 z-50 shadow-2xl relative">
        <BuilderSidebar />
      </div>

      {/* Preview Panel */}
      <div className="flex-1 relative overflow-hidden bg-zinc-900 flex flex-col">
        {/* Preview Topbar */}
        <div className="absolute top-0 inset-x-0 h-14 bg-zinc-950/80 backdrop-blur-md z-40 border-b border-zinc-800/50 flex items-center justify-between px-6">
           <div className="w-32"></div>
           <span className="text-xs tracking-widest uppercase font-medium text-zinc-500 pointer-events-none">Preview Mode</span>
           
           <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-md border border-zinc-800">
              <button 
                onClick={() => setDevice('desktop')}
                className={`p-1.5 rounded-sm transition-colors ${device === 'desktop' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
              </button>
              <button 
                onClick={() => setDevice('tablet')}
                className={`p-1.5 rounded-sm transition-colors ${device === 'tablet' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>
              </button>
              <button 
                onClick={() => setDevice('mobile')}
                className={`p-1.5 rounded-sm transition-colors ${device === 'mobile' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
              </button>
           </div>
        </div>
        
        {/* Renderer Wrapper */}
        <div className="flex-1 overflow-y-auto pt-14 flex justify-center bg-zinc-950/50">
          <div className={`transition-all duration-300 ease-in-out w-full h-full relative ${getDeviceWidth()} ${device !== 'desktop' ? 'my-8 border border-zinc-800/60 rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/5' : ''}`}>
            <Renderer config={formConfig} isPreview={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
