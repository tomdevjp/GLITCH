"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Renderer } from '../../../components/Renderer';
import { supabase } from '../../../lib/supabase';
import { FormConfig } from '../../../types';
import { Loader2, AlertTriangle, Sparkles } from 'lucide-react';

export default function PublicFormPage() {
  const params = useParams();
  const formId = params?.id as string;

  const [config, setConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;

    const fetchForm = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('forms')
          .select('config')
          .eq('id', formId)
          .single();

        if (dbError) throw dbError;
        if (!data || !data.config) {
          throw new Error('This form does not exist or has been deleted.');
        }

        // 型調整
        setConfig(data.config as FormConfig);
      } catch (err: any) {
        console.error('Fetch form error:', err);
        setError(err.message || 'Failed to load the form. Please verify the URL.');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  const handleSubmit = async (answers: Record<string, any>) => {
    if (!formId) return;

    const { error: dbError } = await supabase
      .from('responses')
      .insert([
        {
          form_id: formId,
          answers: answers
        }
      ]);

    if (dbError) {
      throw dbError;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center gap-4 text-zinc-100 font-sans">
        <div className="relative">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <div className="absolute inset-0 w-10 h-10 border border-emerald-500/20 rounded-full animate-ping opacity-25" />
        </div>
        <div className="text-center space-y-1">
          <span className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Loading Form</span>
          <p className="text-[10px] text-zinc-600">Retrieving secure brand environment</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-100 font-sans">
        <div className="w-full max-w-md border border-zinc-800 bg-zinc-950/50 backdrop-blur-md p-6 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.05)] text-center flex flex-col items-center gap-5">
          <div className="w-12 h-12 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-200">Form Not Available</h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-mono p-3 bg-zinc-900/50 border border-zinc-900 rounded text-left">
              {error || 'The requested resource could not be loaded.'}
            </p>
          </div>

          <div className="w-full pt-2">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white py-2 px-4 rounded text-xs transition-colors uppercase tracking-widest font-bold"
            >
              Retry Connection
            </button>
          </div>

          <div className="text-[9px] text-zinc-600 tracking-widest uppercase">
            Powered by GLITCH
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-screen bg-zinc-950 overflow-hidden relative">
      <Renderer config={config} isPreview={false} onSubmit={handleSubmit} />
    </main>
  );
}
