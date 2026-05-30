"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store';
import { FormConfig } from '../../types';
import { Loader2, ArrowRight, Plus, ExternalLink, Calendar, MessageSquare, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FormItem = {
  id: string;
  title: string;
  updated_at: string;
  response_count: number;
};

export default function DashboardTopPage() {
  const { plan, usage } = useAppStore();
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usage Stats (Supabaseの実際のデータ数とプラン情報を組み合わせて表示)
  const formLimit = plan === 'free' ? 3 : 99999;
  const responseLimit = plan === 'free' ? 100 : 999999;

  useEffect(() => {
    const fetchAllForms = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. すべてのフォームを取得
        const { data: dbForms, error: formsError } = await supabase
          .from('forms')
          .select('id, title, updated_at')
          .order('updated_at', { ascending: false });

        if (formsError) throw formsError;

        if (dbForms) {
          // 2. 各フォームの回答数を取得 (非効率なN+1を避けるため、一括集計するか簡易にPromise.all)
          const formsWithCount = await Promise.all(
            dbForms.map(async (form) => {
              const { count, error: countError } = await supabase
                .from('responses')
                .select('*', { count: 'exact', head: true })
                .eq('form_id', form.id);

              return {
                id: form.id,
                title: form.title || 'Untitled Form',
                updated_at: form.updated_at,
                response_count: countError ? 0 : (count || 0)
              };
            })
          );
          setForms(formsWithCount);
        }
      } catch (err: any) {
        console.error('Fetch forms error:', err);
        setError('Failed to fetch dashboard data. Make sure you set up .env.local and created Supabase tables.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllForms();
  }, []);

  const totalResponses = forms.reduce((acc, f) => acc + f.response_count, 0);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-8 max-w-6xl w-full mx-auto space-y-8">
      {/* Header */}
      <header className="flex justify-between items-end border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-zinc-100" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            Campaign Forms
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage and sync your active e-Sports recruitment campaigns</p>
        </div>
        <Link href="/">
          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold uppercase tracking-wider text-[10px] h-9">
            <Plus className="w-3.5 h-3.5 mr-1" /> Create Form
          </Button>
        </Link>
      </header>

      {/* Usage Panel */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Forms Usage */}
        <div className="bg-zinc-900/20 border border-zinc-800/60 p-4 rounded-lg flex flex-col justify-between gap-3">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Forms Created</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-zinc-200">{forms.length}</span>
              <span className="text-xs text-zinc-500">/ {plan === 'free' ? '3' : 'Unlimited'}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min((forms.length / formLimit) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Responses Usage */}
        <div className="bg-zinc-900/20 border border-zinc-800/60 p-4 rounded-lg flex flex-col justify-between gap-3">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Responses Stored</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-zinc-200">{totalResponses}</span>
              <span className="text-xs text-zinc-500">/ {plan === 'free' ? '100' : 'Unlimited'}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min((totalResponses / responseLimit) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Sync Feature Badge */}
        <div className="bg-zinc-900/20 border border-zinc-800/60 p-4 rounded-lg flex flex-col justify-between gap-2 md:col-span-1">
          <div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Google Integration</span>
            <h4 className="text-xs font-semibold text-zinc-300 mt-1">Spreadsheet Auto Sync</h4>
            <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
              {plan === 'free' 
                ? 'Upgrade to PRO to unlock real-time background synchronization directly to your Spreadsheet.' 
                : 'Auto synchronization and webhook delivery are fully active for all your published campaigns.'
              }
            </p>
          </div>
          {plan === 'free' && (
            <Link href="/" className="text-[10px] font-bold uppercase text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors self-start">
              Upgrade Now <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </section>

      {/* Main Content (Forms Table) */}
      <section className="bg-[#0b0b0c] border border-zinc-800/60 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800/60 bg-zinc-950/40 flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">All Forms</span>
          <span className="text-[10px] text-zinc-500 font-mono">{forms.length} total active</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="text-xs text-zinc-500">Connecting database stream...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 gap-4 text-center">
            <ShieldAlert className="w-8 h-8 text-red-500/80 animate-pulse" />
            <div className="space-y-1 max-w-md">
              <span className="text-sm font-bold text-zinc-200">Database Connection Failed</span>
              <p className="text-xs text-zinc-500 leading-relaxed font-mono p-3 bg-zinc-900/50 rounded border border-zinc-800/50 text-left">
                {error}
              </p>
            </div>
            <Link href="/">
              <Button size="sm" className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-bold uppercase text-zinc-300">
                Back to Builder
              </Button>
            </Link>
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center text-zinc-500">
              <Plus className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-bold text-zinc-300">No forms published yet</span>
              <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                Design your form in the builder and click the "Publish" button to see your campaigns listed here.
              </p>
            </div>
            <Link href="/">
              <Button size="sm" className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase">
                Launch Creator
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-950/20 text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold">Form Title</th>
                  <th className="py-4 px-6 font-semibold">Public Link</th>
                  <th className="py-4 px-6 font-semibold text-center">Responses</th>
                  <th className="py-4 px-6 font-semibold">Last Updated</th>
                  <th className="py-4 px-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {forms.map((form) => (
                  <tr key={form.id} className="hover:bg-zinc-900/20 transition-colors group">
                    {/* Title */}
                    <td className="py-4 px-6 font-bold text-zinc-200">
                      <Link href={`/dashboard/forms/${form.id}`} className="hover:text-emerald-400 transition-colors">
                        {form.title}
                      </Link>
                    </td>

                    {/* URL */}
                    <td className="py-4 px-6 font-mono text-[10px] text-zinc-400">
                      <a 
                        href={`/f/${form.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="hover:text-emerald-400 inline-flex items-center gap-1 transition-colors group/link"
                      >
                        /f/{form.id.slice(0, 8)}...
                        <ExternalLink className="w-3 h-3 text-zinc-600 group-hover/link:text-emerald-400 transition-colors" />
                      </a>
                    </td>

                    {/* Count */}
                    <td className="py-4 px-6 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 font-semibold font-mono text-zinc-300">
                        {form.response_count}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                        {new Date(form.updated_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <Link 
                        href={`/dashboard/forms/${form.id}`} 
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 hover:text-white uppercase tracking-widest font-bold border border-zinc-800 rounded transition-all inline-flex items-center gap-1"
                      >
                        Manage <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
