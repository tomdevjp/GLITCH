"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabase';
import { FormConfig, Question } from '../../../../types';
import { useAppStore } from '../../../../store';
import { 
  Loader2, ArrowLeft, ExternalLink, Copy, Check, Table, 
  Download, Sparkles, Gem, RefreshCw, Calendar, Trash2, ShieldAlert 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type AnswerRow = {
  id: string;
  created_at: string;
  answers: Record<string, any>;
};

export default function FormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params?.formId as string;
  const { plan } = useAppStore();

  const [config, setConfig] = useState<FormConfig | null>(null);
  const [responses, setResponses] = useState<AnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for Copy / Action feedback
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // States for Google Mock Connect
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  useEffect(() => {
    if (!formId) return;
    fetchFormDetails();
  }, [formId]);

  const fetchFormDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. フォーム設定の取得
      const { data: dbForm, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (formError) throw formError;
      if (!dbForm) throw new Error('Form not found.');

      // Supabaseの最上位カラムとconfig.jsonbの両方をマージして整合性をとる
      const baseConfig = dbForm.config as FormConfig;
      const mergedConfig = {
        ...baseConfig,
        id: dbForm.id,
        title: dbForm.title,
        spreadsheetUrl: dbForm.spreadsheet_url || baseConfig.spreadsheetUrl,
        googleConnectedEmail: dbForm.google_connected_email || baseConfig.googleConnectedEmail,
      };

      setConfig(mergedConfig);

      // 2. 回答データの取得
      const { data: dbResponses, error: respError } = await supabase
        .from('responses')
        .select('id, created_at, answers')
        .eq('form_id', formId)
        .order('created_at', { ascending: false });

      if (respError) throw respError;
      setResponses(dbResponses || []);
    } catch (err: any) {
      console.error('Fetch form details error:', err);
      setError(err.message || 'Failed to load campaign details.');
    } finally {
      setLoading(false);
    }
  };

  // URL コピー
  const handleCopyUrl = () => {
    if (!config) return;
    const publicUrl = `${window.location.origin}/f/${config.id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Googleアカウントの模擬連携
  const handleConnectGoogle = async () => {
    if (!config) return;
    setIsConnectingGoogle(true);

    try {
      // 1.5秒のローディングで認証画面をシミュレート
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockEmail = 'esports.manager@gmail.com';

      // Supabaseの物理カラム ＆ config JSONの両方に保存
      const updatedConfig = { ...config, googleConnectedEmail: mockEmail };
      const { error: dbError } = await supabase
        .from('forms')
        .update({
          google_connected_email: mockEmail,
          config: updatedConfig
        })
        .eq('id', formId);

      if (dbError) throw dbError;

      setConfig(updatedConfig);
    } catch (err: any) {
      alert('Failed to connect Google Account.');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  // スプレッドシート自動生成の模擬連携
  const handleCreateSpreadsheet = async () => {
    if (!config) return;
    setIsCreatingSheet(true);

    try {
      // 2秒のローディングでシート生成をシミュレート
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockSheetId = `glitch_sheet_${Date.now()}`;
      const mockSheetUrl = `https://docs.google.com/spreadsheets/d/${mockSheetId}/edit`;

      // Supabase ＆ config に保存
      const updatedConfig = { ...config, spreadsheetUrl: mockSheetUrl };
      const { error: dbError } = await supabase
        .from('forms')
        .update({
          spreadsheet_url: mockSheetUrl,
          spreadsheet_id: mockSheetId,
          config: updatedConfig
        })
        .eq('id', formId);

      if (dbError) throw dbError;

      setConfig(updatedConfig);
    } catch (err: any) {
      alert('Failed to initialize Google Spreadsheet.');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // CSV 手動エクスポート (Excel文字化け対策BOM付き)
  const handleExportCSV = async () => {
    if (!config || responses.length === 0) return;
    setIsExportingCSV(true);

    try {
      const questions = config.questions || [];
      const headers = ['Submitted At', ...questions.map(q => q.title)];

      const csvRows = responses.map(row => {
        const answers = row.answers || {};
        const timestamp = new Date(row.created_at).toLocaleString();
        
        const cols = [
          `"${timestamp.replace(/"/g, '""')}"`,
          ...questions.map(q => {
            const answerVal = answers[q.id];
            if (answerVal === undefined || answerVal === null) return '""';
            const strVal = typeof answerVal === 'object' ? JSON.stringify(answerVal) : String(answerVal);
            return `"${strVal.replace(/"/g, '""')}"`;
          })
        ];
        return cols.join(',');
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `glitch_responses_${config.title.replace(/[^a-zA-Z0-9ぁ-んァ-ヶー一-龠]/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('CSV Export failed.');
    } finally {
      setIsExportingCSV(false);
    }
  };

  // フォーム削除 (カスケード削除)
  const handleDeleteForm = async () => {
    if (!config) return;
    const confirmDelete = window.confirm(
      'Are you absolutely sure you want to delete this form?\nAll associated responses will be deleted permanently.'
    );
    if (!confirmDelete) return;

    setIsDeleting(true);

    try {
      const { error: dbError } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (dbError) throw dbError;

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Delete form error:', err);
      alert('Failed to delete form.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#09090b]">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        <span className="text-xs text-zinc-500">Decrypting campaign details...</span>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4 bg-[#09090b]">
        <ShieldAlert className="w-8 h-8 text-red-500" />
        <div className="space-y-1">
          <span className="text-sm font-bold text-zinc-200">Failed to Retrieve Details</span>
          <p className="text-xs text-zinc-500 max-w-sm">{error || 'This resource could not be loaded.'}</p>
        </div>
        <Link href="/dashboard">
          <Button size="sm" className="bg-zinc-900 border border-zinc-800 text-xs">
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/f/${config.id}`;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-8 max-w-5xl w-full mx-auto space-y-8">
      {/* Back Button */}
      <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest self-start transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      {/* Top Banner (Hero Preview & Details) */}
      <section className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl overflow-hidden shadow-2xl relative">
        {/* Subtle decorative glow */}
        <div 
          className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: config.theme.colors.primary }}
        />

        {/* Hero visual panel */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-zinc-800/40 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                Live Campaign
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">ID: {config.id.slice(0, 8)}...</span>
            </div>
            <h2 className="text-2xl font-black text-zinc-100 uppercase tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
              {config.title}
            </h2>
          </div>

          <div className="flex gap-2 self-stretch md:self-auto">
            <button 
              onClick={() => window.open(publicUrl, '_blank')}
              className="flex-1 md:flex-none px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] text-zinc-300 hover:text-white uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              Visit Live <ExternalLink className="w-3 h-3" />
            </button>
            <button 
              onClick={handleCopyUrl}
              className="flex-1 md:flex-none px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              {copied ? (
                <>
                  Copied! <Check className="w-3 h-3 text-zinc-950" />
                </>
              ) : (
                <>
                  Copy Link <Copy className="w-3 h-3 text-zinc-950" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info list */}
        <div className="px-6 py-4 bg-zinc-950/40 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Total Submissions</span>
            <span className="text-base font-bold text-zinc-300 font-mono mt-0.5 block">{responses.length}</span>
          </div>
          <div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Spreadsheet Status</span>
            <span className="text-xs font-bold mt-1 inline-flex items-center gap-1">
              {config.spreadsheetUrl ? (
                <span className="text-emerald-400 font-mono uppercase text-[10px]">Connected</span>
              ) : (
                <span className="text-zinc-600 font-mono uppercase text-[10px]">Disconnected</span>
              )}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Google Account</span>
            <span className="text-xs font-medium text-zinc-400 mt-0.5 block truncate">
              {config.googleConnectedEmail || 'Not Connected'}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Updated At</span>
            <span className="text-xs font-medium text-zinc-400 mt-0.5 block">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </section>

      {/* Tabs Control Section */}
      <Tabs defaultValue="responses" className="space-y-6">
        <TabsList className="bg-transparent border-b border-zinc-800/60 rounded-none w-full justify-start p-0 gap-6">
          <TabsTrigger value="responses" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-400 border-b-2 border-transparent data-[state=active]:border-emerald-500 rounded-none py-3 px-1 text-xs uppercase tracking-widest font-bold text-zinc-500 hover:text-zinc-300">
            Submissions
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-400 border-b-2 border-transparent data-[state=active]:border-emerald-500 rounded-none py-3 px-1 text-xs uppercase tracking-widest font-bold text-zinc-500 hover:text-zinc-300">
            Sync & Export
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-400 border-b-2 border-transparent data-[state=active]:border-emerald-500 rounded-none py-3 px-1 text-xs uppercase tracking-widest font-bold text-zinc-500 hover:text-zinc-300">
            Config Settings
          </TabsTrigger>
        </TabsList>

        {/* 1. Responses List Tab */}
        <TabsContent value="responses" className="outline-none mt-0">
          <div className="bg-[#0b0b0c] border border-zinc-800/60 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800/60 bg-zinc-950/40 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Response Log</span>
              <span className="text-[10px] text-zinc-500 font-mono">{responses.length} responses</span>
            </div>

            {responses.length === 0 ? (
              <div className="py-20 text-center text-zinc-500 text-xs">
                No submissions recorded yet for this active campaign.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800/60 bg-zinc-950/10 text-zinc-500 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-6 font-semibold w-48">Submitted Date</th>
                      {config.questions.slice(0, 3).map((q) => (
                        <th key={q.id} className="py-3.5 px-6 font-semibold max-w-xs truncate">{q.title}</th>
                      ))}
                      {config.questions.length > 3 && (
                        <th className="py-3.5 px-6 font-semibold">Other data</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {responses.map((row) => (
                      <tr key={row.id} className="hover:bg-zinc-900/10 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3.5 px-6 font-medium text-zinc-300">
                          {new Date(row.created_at).toLocaleString()}
                        </td>

                        {/* Fields */}
                        {config.questions.slice(0, 3).map((q) => {
                          const ans = row.answers[q.id];
                          const strAns = typeof ans === 'object' ? JSON.stringify(ans) : String(ans || '-');
                          return (
                            <td key={q.id} className="py-3.5 px-6 text-zinc-400 max-w-xs truncate font-mono">
                              {strAns}
                            </td>
                          );
                        })}

                        {/* Other */}
                        {config.questions.length > 3 && (
                          <td className="py-3.5 px-6 text-zinc-500 italic">
                            +{config.questions.length - 3} fields
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 2. Export & Sync Tab */}
        <TabsContent value="export" className="outline-none mt-0 space-y-6">
          {/* CSV Export Area */}
          <div className="bg-zinc-900/10 border border-zinc-800/60 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">Manual CSV Data Export</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Download all answers compiled into a flat UTF-8 BOM CSV table (Excel fully supported)</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 justify-between pt-2 border-t border-zinc-900">
              <span className="text-xs text-zinc-400 font-mono">{responses.length} responses ready</span>
              <Button 
                onClick={handleExportCSV}
                disabled={responses.length === 0 || isExportingCSV}
                className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold uppercase tracking-wider text-[10px]"
              >
                {isExportingCSV ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
                Download CSV Table
              </Button>
            </div>
          </div>

          {/* Google Spreadsheet Integration Area */}
          <div className="bg-zinc-900/10 border border-zinc-800/60 rounded-xl p-6 space-y-6 relative overflow-hidden">
            {/* Sync active decorative accent */}
            {config.spreadsheetUrl && (
              <div className="absolute right-0 top-0 h-1 bg-emerald-500 animate-pulse w-full" />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded">
                  <Table className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">Google Spreadsheet Live Sync</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Automate and streamline campaign operations by syncing submissions directly</p>
                </div>
              </div>
              
              {/* Feature Type Badge */}
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono text-[9px] text-zinc-400 font-bold uppercase select-none">
                {plan === 'free' ? 'Free (Manual Sync)' : 'PRO (Auto Background Sync)'}
              </div>
            </div>

            {/* Integration Steps / Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Step 1: Connect Account */}
              <div className="space-y-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono">Step 1: Authorization</span>
                <div className="bg-zinc-950/40 p-4 border border-zinc-800/40 rounded-lg flex flex-col gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-zinc-400">Connected Google Account</Label>
                    <Input 
                      readOnly 
                      value={config.googleConnectedEmail || 'No account authorized'} 
                      className="bg-zinc-900 border-zinc-800 text-xs font-mono h-9 text-zinc-300"
                    />
                  </div>
                  
                  {!config.googleConnectedEmail ? (
                    <Button 
                      onClick={handleConnectGoogle}
                      disabled={isConnectingGoogle}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] uppercase font-bold tracking-widest h-9"
                    >
                      {isConnectingGoogle ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                      Connect Google Account
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        disabled
                        className="flex-1 bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 text-[10px] uppercase font-bold tracking-widest h-9"
                      >
                        Account Connected
                      </Button>
                      <Button 
                        onClick={() => handleConnectGoogle()}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 border border-zinc-800 text-[10px] uppercase font-bold h-9 px-3"
                      >
                        Reset
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Spreadsheet Sync */}
              <div className="space-y-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono">Step 2: Sync Workspace</span>
                <div className="bg-zinc-950/40 p-4 border border-zinc-800/40 rounded-lg flex flex-col gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-zinc-400">Spreadsheet Live Link</Label>
                    <Input 
                      readOnly 
                      value={config.spreadsheetUrl || 'Not Connected'} 
                      className="bg-zinc-900 border-zinc-800 text-xs font-mono h-9 text-zinc-300"
                    />
                  </div>

                  {!config.googleConnectedEmail ? (
                    <span className="text-[10px] text-zinc-500 italic text-center p-2 block">
                      Authorize step 1 to configure spreadsheet sync
                    </span>
                  ) : !config.spreadsheetUrl ? (
                    <Button 
                      onClick={handleCreateSpreadsheet}
                      disabled={isCreatingSheet}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-[10px] uppercase font-bold tracking-widest h-9"
                    >
                      {isCreatingSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                      Initialize Live Spreadsheet
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => window.open(config.spreadsheetUrl, '_blank')}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 text-[10px] uppercase font-bold tracking-widest h-9 flex items-center justify-center gap-1.5"
                      >
                        Open Spreadsheet <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        onClick={() => handleCreateSpreadsheet()}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white border border-zinc-800 text-[10px] uppercase font-bold h-9 px-3"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sync Type Feature Panel */}
            {config.spreadsheetUrl && (
              <div className="p-4 bg-zinc-950/40 rounded-lg border border-zinc-800/60 flex items-center justify-between text-xs gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-zinc-300">Synchronized Pipeline Active</span>
                  <p className="text-[10px] text-zinc-500 leading-relaxed max-w-xl">
                    {plan === 'free' 
                      ? 'Free tier requires manual export updates. Upgrading to Pro enables automated background streaming.' 
                      : 'Campaign syncing is fully configured. Submissions stream in real-time to your Google sheet.'
                    }
                  </p>
                </div>
                {plan === 'free' && (
                  <Button size="sm" className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-bold tracking-widest h-8 shrink-0">
                    <Gem className="w-3 h-3 mr-1" /> Go Pro
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 3. Config Settings Tab */}
        <TabsContent value="settings" className="outline-none mt-0">
          <div className="bg-zinc-900/10 border border-zinc-800/60 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">Danger Zone</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Critical management operations that impact DB structures permanently</p>
            </div>

            <div className="h-px bg-zinc-800/40" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-zinc-300">Delete this campaign</span>
                <p className="text-[10px] text-zinc-500 leading-relaxed max-w-md">
                  This operation deletes both the form layout configurations and all submitted responses. This action is irreversible.
                </p>
              </div>

              <Button 
                onClick={handleDeleteForm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-[10px] h-9"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Campaign
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
