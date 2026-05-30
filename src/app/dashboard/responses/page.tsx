"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { FormConfig } from '../../../types';
import { Loader2, Download, Table, Calendar, ExternalLink, ShieldAlert, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FormResponseSummary = {
  id: string;
  title: string;
  total_responses: number;
  last_response_at: string | null;
  config: FormConfig;
};

export default function ResponsesPage() {
  const [summaries, setSummaries] = useState<FormResponseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchResponseSummaries = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. 全フォームのメタ情報を取得
        const { data: dbForms, error: formsError } = await supabase
          .from('forms')
          .select('id, title, config')
          .order('updated_at', { ascending: false });

        if (formsError) throw formsError;

        if (dbForms) {
          // 2. 各フォームの回答統計を取得
          const summariesWithCount = await Promise.all(
            dbForms.map(async (form) => {
              // 最も新しい回答を1件取得して日時を確認
              const { data: lastResp, error: lastRespError } = await supabase
                .from('responses')
                .select('created_at')
                .eq('form_id', form.id)
                .order('created_at', { ascending: false })
                .limit(1);

              // 総回答数をカウント
              const { count, error: countError } = await supabase
                .from('responses')
                .select('*', { count: 'exact', head: true })
                .eq('form_id', form.id);

              return {
                id: form.id,
                title: form.title || 'Untitled Form',
                total_responses: countError ? 0 : (count || 0),
                last_response_at: lastRespError || !lastResp || lastResp.length === 0 ? null : lastResp[0].created_at,
                config: form.config as FormConfig
              };
            })
          );

          setSummaries(summariesWithCount);
        }
      } catch (err: any) {
        console.error('Fetch summaries error:', err);
        setError('Failed to fetch responses summary. Please verify your Supabase tables and policies.');
      } finally {
        setLoading(false);
      }
    };

    fetchResponseSummaries();
  }, []);

  // Excel等での日本語文字化けを防ぐBOM付きCSVダウンロード機能
  const handleExportCSV = async (formId: string, formTitle: string, config: FormConfig) => {
    try {
      setExportingId(formId);
      
      // 1. responsesからすべての回答データを取得
      const { data: responses, error: respError } = await supabase
        .from('responses')
        .select('created_at, answers')
        .eq('form_id', formId)
        .order('created_at', { ascending: true });

      if (respError) throw respError;

      if (!responses || responses.length === 0) {
        alert('No responses recorded for this form yet.');
        return;
      }

      // 2. ヘッダーの生成 (Submitted At + 設問タイトル)
      const questions = config.questions || [];
      const headers = ['Submitted At', ...questions.map(q => q.title)];

      // 3. データ行のパース
      const csvRows = responses.map(row => {
        const answers = row.answers || {};
        const timestamp = new Date(row.created_at).toLocaleString();
        
        const cols = [
          `"${timestamp.replace(/"/g, '""')}"`,
          ...questions.map(q => {
            const answerVal = answers[q.id];
            
            // 未入力やオプショナル項目のフォールバック
            if (answerVal === undefined || answerVal === null) {
              return '""';
            }
            
            // 配列やオブジェクトの場合
            const strVal = typeof answerVal === 'object' 
              ? JSON.stringify(answerVal) 
              : String(answerVal);
              
            // CSVのエスケープ処理
            return `"${strVal.replace(/"/g, '""')}"`;
          })
        ];
        
        return cols.join(',');
      });

      // 4. CSV文字列の生成
      const csvContent = [headers.join(','), ...csvRows].join('\n');

      // 5. UTF-8 BOMを付与してエクスポート (日本語のExcel文字化け防止)
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `glitch_responses_${formTitle.replace(/[^a-zA-Z0-9ぁ-んァ-ヶー一-龠]/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('CSV Export Error:', err);
      alert('Failed to generate CSV export. Please check console logs.');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-8 max-w-6xl w-full mx-auto space-y-8">
      {/* Header */}
      <header className="border-b border-zinc-800/60 pb-6">
        <h1 className="text-xl font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
          <MessageSquare className="w-5 h-5 text-emerald-400" /> Responses Directory
        </h1>
        <p className="text-xs text-zinc-500 mt-1">Export, track response counts, and coordinate spreadsheet syncing from a lightweight directory</p>
      </header>

      {/* Main Table Panel */}
      <section className="bg-[#0b0b0c] border border-zinc-800/60 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800/60 bg-zinc-950/40 flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Response Overview</span>
          <span className="text-[10px] text-zinc-500 font-mono">MVP Lightweight Management</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="text-xs text-zinc-500">Retrieving campaign stats...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 gap-4 text-center">
            <ShieldAlert className="w-8 h-8 text-red-500/80 animate-pulse" />
            <div className="space-y-1 max-w-md">
              <span className="text-sm font-bold text-zinc-200">Retrieval Failed</span>
              <p className="text-xs text-zinc-500 leading-relaxed font-mono p-3 bg-zinc-900/50 rounded border border-zinc-800/50 text-left">
                {error}
              </p>
            </div>
            <Link href="/dashboard">
              <Button size="sm" className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-bold uppercase text-zinc-300">
                Retry Connection
              </Button>
            </Link>
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center text-zinc-500">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-bold text-zinc-300">No campaigns registered</span>
              <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                Forms created and published in the main editor will dynamically populate response summary stats here.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-950/20 text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold">Form Name</th>
                  <th className="py-4 px-6 font-semibold text-center">Total Responses</th>
                  <th className="py-4 px-6 font-semibold">Last Submission</th>
                  <th className="py-4 px-6 font-semibold">Data Link</th>
                  <th className="py-4 px-6 font-semibold text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {summaries.map((sum) => (
                  <tr key={sum.id} className="hover:bg-zinc-900/20 transition-colors">
                    {/* Title */}
                    <td className="py-4 px-6 font-bold text-zinc-200">
                      <Link href={`/dashboard/forms/${sum.id}`} className="hover:text-emerald-400 transition-colors">
                        {sum.title}
                      </Link>
                    </td>

                    {/* Total Responses */}
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-bold font-mono text-emerald-400">
                        {sum.total_responses}
                      </div>
                    </td>

                    {/* Last Submission */}
                    <td className="py-4 px-6 text-zinc-400">
                      {sum.last_response_at ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                          {new Date(sum.last_response_at).toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-zinc-600 italic">No responses yet</span>
                      )}
                    </td>

                    {/* Spreadsheet Sync State */}
                    <td className="py-4 px-6">
                      {sum.config.spreadsheetUrl ? (
                        <a 
                          href={sum.config.spreadsheetUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] bg-emerald-950/20 text-emerald-400 border border-emerald-900/50 px-2 py-1 rounded inline-flex items-center gap-1 hover:border-emerald-500 transition-colors font-mono"
                        >
                          <Table className="w-3 h-3" /> Sync Active
                        </a>
                      ) : (
                        <span className="text-[10px] bg-zinc-900 text-zinc-500 border border-zinc-800 px-2 py-1 rounded font-mono select-none">
                          Not Connected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Link 
                          href={`/dashboard/forms/${sum.id}#responses`}
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-400 hover:text-white uppercase tracking-widest font-bold border border-zinc-800 rounded transition-all inline-flex items-center gap-1"
                        >
                          View List
                        </Link>
                        
                        <Button 
                          onClick={() => handleExportCSV(sum.id, sum.title, sum.config)}
                          disabled={sum.total_responses === 0 || exportingId === sum.id}
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold uppercase tracking-wider text-[10px] h-8 shrink-0"
                        >
                          {exportingId === sum.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Download className="w-3 h-3 mr-1" />
                          )}
                          Export CSV
                        </Button>
                      </div>
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
