import React from 'react';
import { useAppStore } from '../store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DesignEditor } from './DesignEditor';
import { Separator } from '@/components/ui/separator';
import { Layers, Palette, Layout, Settings2, Plus, Sparkles, Gem, ArrowRight, Zap, Copy, Check, Loader2, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export function BuilderSidebar() {
  const { formConfig, updateHero, updateSettings, updateQuestions, plan, setPlan, usage, setFormId } = useAppStore();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // Publish States
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [publishedUrl, setPublishedUrl] = React.useState('');
  const [pubError, setPubError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handlePublish = async () => {
    setIsModalOpen(true);
    setIsPublishing(true);
    setPubError(null);
    setCopied(false);

    try {
      const isNew = formConfig.id === 'default-form';
      
      const dataToSave = {
        title: formConfig.title || formConfig.hero.title || 'Untitled Form',
        config: {
          ...formConfig,
          id: isNew ? 'placeholder' : formConfig.id // 新規の時は後でIDが決定するので一旦プレースホルダー
        },
      };

      let responseId = formConfig.id;

      if (isNew) {
        const { data, error: dbError } = await supabase
          .from('forms')
          .insert([dataToSave])
          .select()
          .single();

        if (dbError) throw dbError;
        if (data) {
          responseId = data.id;
          setFormId(data.id);
          
          // 保存された最新のIDを反映させたconfigに更新
          const updatedConfig = {
            ...formConfig,
            id: data.id
          };
          await supabase
            .from('forms')
            .update({ config: updatedConfig })
            .eq('id', data.id);
        }
      } else {
        const { error: dbError } = await supabase
          .from('forms')
          .upsert([{ id: formConfig.id, ...dataToSave }]);

        if (dbError) throw dbError;
      }

      const origin = window.location.origin;
      const url = `${origin}/f/${responseId}`;
      setPublishedUrl(url);
    } catch (err: any) {
      console.error('Publish error:', err);
      setPubError(err.message || 'Failed to publish form. Please check your Supabase credentials and DDL.');
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addQuestion = () => {
    const newId = 'q' + Date.now();
    updateQuestions([
      ...formConfig.questions,
      { id: newId, type: 'shortText', title: 'New Question', required: false }
    ]);
    setExpandedId(newId);
  };

  const updateQuestion = (id: string, updates: Partial<typeof formConfig.questions[0]>) => {
    updateQuestions(formConfig.questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    updateQuestions(formConfig.questions.filter(q => q.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    /* ==========================================================================
       【UI全体のコンテナ】
       サイドバーの外枠（漆黒の背景、極薄ボーダー、Space Groteskフォントなど）です。
       ========================================================================== */
    <div className="w-full h-full bg-zinc-950 text-zinc-100 border-r border-zinc-800 flex flex-col font-sans">
      
      {/* --------------------------------------------------------------------------
          ① サイドバーヘッダー（ロゴ ＆ 公開Publishボタン）
          -------------------------------------------------------------------------- */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
        {/* 左側：GLITCH テキストロゴ */}
        <div className="flex items-center gap-2">
           <h2 className="font-black text-xl tracking-[0.12em] text-zinc-100" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
             GLI<span className="text-emerald-400">TCH</span>
           </h2>
           {/* PROプランバッジ */}
           {plan === 'pro' && (
             <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-zinc-950 ml-1 flex items-center gap-1">
               <Gem className="w-3 h-3" /> PRO
             </span>
           )}
        </div>
        {/* 右側：Publish（公開用URL発行）ボタン */}
        <Button onClick={handlePublish} variant="outline" size="sm" className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-xs text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 transition-colors">
          Publish
        </Button>
      </div>

      {/* --------------------------------------------------------------------------
          ② プランアップグレード促進バナー（Free版の時に表示）
          -------------------------------------------------------------------------- */}
      {plan === 'free' && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-transparent p-3 border-b border-zinc-800 flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-xs font-semibold text-emerald-400">Upgrade to Pro</span>
              <span className="text-[10px] text-zinc-400">Video backgrounds, custom domains & more.</span>
           </div>
           <Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold" onClick={() => setPlan('pro')}>
              Upgrade <ArrowRight className="w-3 h-3 ml-1" />
           </Button>
        </div>
      )}

      {/* --------------------------------------------------------------------------
          ③ プランダウングレードバナー（Pro版のデモ解除用に表示）
          -------------------------------------------------------------------------- */}
      {plan === 'pro' && (
         <div className="bg-gradient-to-r from-zinc-800/30 to-transparent p-3 border-b border-zinc-800 flex items-center justify-between cursor-pointer" onClick={() => setPlan('free')}>
           <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-zinc-400 font-medium hover:text-white transition-colors">Downgrade to Free (Demo)</span>
           </div>
         </div>
      )}

      {/* --------------------------------------------------------------------------
          ④ 編集メニューのタブ切り替え（「構成タブ」と「デザインタブ」）
          -------------------------------------------------------------------------- */}
      <Tabs defaultValue="design" className="flex-1 flex flex-col overflow-hidden">
        {/* タブ選択ヘッダー */}
        <TabsList className="w-full justify-start rounded-none border-b border-zinc-800 bg-zinc-950/50 p-0">
          {/* Structure (構成) タブボタン */}
          <TabsTrigger value="structure" className="data-[state=active]:bg-zinc-900/80 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 py-3 px-4 flex items-center gap-2">
            <Layout className="w-4 h-4" />
            <span className="text-xs font-medium">Structure</span>
          </TabsTrigger>
          {/* Design (デザイン) タブボタン */}
          <TabsTrigger value="design" className="data-[state=active]:bg-zinc-900/80 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 py-3 px-4 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="text-xs font-medium">Design</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="structure" className="p-4 space-y-8 mt-0 outline-none">
            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                   <Layers className="w-4 h-4" />
                   Hero Section
                </h3>
                <p className="text-xs text-zinc-500">The landing area of your form.</p>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="hero-title" className="text-xs text-zinc-400">Heading</Label>
                  <Input 
                    id="hero-title" 
                    value={formConfig.hero.title}
                    onChange={(e) => updateHero({ title: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hero-desc" className="text-xs text-zinc-400">Description</Label>
                  <Input 
                    id="hero-desc" 
                    value={formConfig.hero.description}
                    onChange={(e) => updateHero({ description: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-sm"
                  />
                </div>
              </div>
            </section>

            <Separator className="bg-zinc-800" />
            
            <section className="space-y-4">
               <div className="space-y-1">
                <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                   <Layout className="w-4 h-4" />
                   Questions
                </h3>
                <p className="text-xs text-zinc-500">Manage form fields and structure.</p>
              </div>
              <div className="space-y-2">
                 {formConfig.questions.map((q, index) => (
                    <div key={q.id} className="border border-zinc-800 rounded bg-zinc-900/30 overflow-hidden transition-colors">
                       <div 
                         className="p-3 flex items-center justify-between hover:bg-zinc-900 cursor-pointer"
                         onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                       >
                         <div className="flex flex-col gap-1">
                           <span className="text-sm font-medium text-zinc-200">{q.title || 'Untitled Field'}</span>
                           <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{q.type}</span>
                         </div>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-6 px-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                           onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }}
                         >
                           Remove
                         </Button>
                       </div>
                       
                       {expandedId === q.id && (
                         <div className="p-3 border-t border-zinc-800 space-y-3 bg-zinc-950/50">
                           <div className="space-y-1.5">
                             <Label className="text-xs text-zinc-400">Field Label</Label>
                             <Input 
                               value={q.title} 
                               onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                               className="bg-zinc-900 border-zinc-800 text-sm h-8"
                             />
                           </div>
                           
                           <div className="space-y-1.5">
                             <Label className="text-xs text-zinc-400">Description (Optional)</Label>
                             <Input 
                               value={q.description || ''} 
                               onChange={(e) => updateQuestion(q.id, { description: e.target.value })}
                               className="bg-zinc-900 border-zinc-800 text-sm h-8"
                             />
                           </div>

                           {['shortText', 'longText', 'url', 'dropdown'].includes(q.type) && (
                             <div className="space-y-1.5">
                               <Label className="text-xs text-zinc-400">Placeholder (Optional)</Label>
                               <Input 
                                 value={q.placeholder || ''} 
                                 onChange={(e) => updateQuestion(q.id, { placeholder: e.target.value })}
                                 className="bg-zinc-900 border-zinc-800 text-sm h-8"
                                 placeholder={
                                   q.type === 'url' ? 'https://' : 
                                   q.type === 'dropdown' ? 'Select an option' : 'Your answer'
                                 }
                               />
                             </div>
                           )}

                           <div className="space-y-1.5">
                             <Label className="text-xs text-zinc-400">Field Type</Label>
                             <Select 
                               value={q.type} 
                               onValueChange={(val: any) => updateQuestion(q.id, { type: val, options: (val === 'singleChoice' || val === 'dropdown') ? (q.options || ['Option 1']) : undefined })}
                             >
                               <SelectTrigger className="bg-zinc-900 border-zinc-800 h-8 text-sm">
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="shortText">Short Text</SelectItem>
                                 <SelectItem value="longText">Long Text</SelectItem>
                                 <SelectItem value="singleChoice">Single Choice</SelectItem>
                                 <SelectItem value="dropdown">Dropdown</SelectItem>
                                 <SelectItem value="url">URL Link</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>

                           {(q.type === 'singleChoice' || q.type === 'dropdown') && (
                             <div className="space-y-1.5 pt-1">
                               <Label className="text-xs text-zinc-400">Options</Label>
                               <div className="space-y-2">
                                 {q.options?.map((opt, i) => (
                                   <div key={i} className="flex gap-2">
                                     <Input 
                                       value={opt} 
                                       onChange={(e) => {
                                         const newOpts = [...(q.options || [])];
                                         newOpts[i] = e.target.value;
                                         updateQuestion(q.id, { options: newOpts });
                                       }}
                                       className="bg-zinc-900 border-zinc-800 text-sm h-8"
                                     />
                                     <Button 
                                       variant="outline" 
                                       size="sm" 
                                       className="h-8 w-8 p-0 shrink-0 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-red-400"
                                       onClick={() => {
                                         const newOpts = [...(q.options || [])];
                                         newOpts.splice(i, 1);
                                         updateQuestion(q.id, { options: newOpts });
                                       }}
                                     >
                                       ×
                                     </Button>
                                   </div>
                                 ))}
                                 <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   className="h-7 text-xs text-emerald-400 hover:text-emerald-300 w-full bg-emerald-500/10 hover:bg-emerald-500/20"
                                   onClick={() => {
                                     updateQuestion(q.id, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] });
                                   }}
                                 >
                                   + Add Option
                                 </Button>
                               </div>
                             </div>
                           )}

                           <div className="flex items-center justify-between pt-2">
                             <Label className="text-xs text-zinc-300">Required Field</Label>
                             <Switch 
                               checked={q.required} 
                               onCheckedChange={(v) => updateQuestion(q.id, { required: v })}
                             />
                           </div>
                         </div>
                       )}
                    </div>
                 ))}
                 <Button 
                   variant="outline" 
                   className="w-full mt-2 bg-zinc-900/50 border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center gap-2"
                   onClick={addQuestion}
                 >
                    <Plus className="w-4 h-4" />
                    Add Field
                 </Button>
              </div>
            </section>
            
            <Separator className="bg-zinc-800" />
            
            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                   <Settings2 className="w-4 h-4" />
                   Settings
                </h3>
              </div>
              <div className="space-y-1.5">
                  <Label htmlFor="submit-label" className="text-xs text-zinc-400">Submit Button Label</Label>
                  <Input 
                    id="submit-label" 
                    value={formConfig.settings.submitLabel}
                    onChange={(e) => updateSettings({ submitLabel: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-sm"
                  />
              </div>

              <div className="flex items-center justify-between pt-2">
                 <div className="space-y-0.5">
                    <Label className="text-xs text-zinc-300">Remove GLITCH Branding</Label>
                    {plan === 'free' && <p className="text-[10px] text-zinc-500">Requires Pro plan</p>}
                 </div>
                 <Switch 
                   checked={formConfig.settings.removeBranding} 
                   onCheckedChange={(v) => updateSettings({ removeBranding: v })}
                   disabled={plan === 'free'}
                 />
              </div>
            </section>

            <Separator className="bg-zinc-800" />
            
            <section className="space-y-4 pb-8">
               <div className="space-y-1">
                <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest">
                   Usage & Limits
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                 <div className="bg-zinc-900 p-3 rounded border border-zinc-800 flex flex-col gap-1">
                    <span className="text-zinc-500">Forms</span>
                    <span className="text-zinc-200 font-medium">
                       {usage.forms} <span className="text-zinc-600">/ {plan === 'free' ? '3' : '∞'}</span>
                    </span>
                 </div>
                 <div className="bg-zinc-900 p-3 rounded border border-zinc-800 flex flex-col gap-1">
                    <span className="text-zinc-500">Responses</span>
                    <span className="text-zinc-200 font-medium">
                       {usage.responses} <span className="text-zinc-600">/ {plan === 'free' ? '100' : '∞'}</span>
                    </span>
                 </div>
                 <div className="bg-zinc-900 p-3 rounded border border-zinc-800 flex flex-col gap-1 col-span-2">
                    <div className="flex justify-between items-end mb-1">
                       <span className="text-zinc-500">Storage</span>
                       <span className="text-zinc-200 font-medium">
                          {usage.storageMb}MB <span className="text-zinc-600">/ {plan === 'free' ? '100MB' : '10GB+'}</span>
                       </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(usage.storageMb / (plan === 'free' ? 100 : 10000)) * 100}%` }}></div>
                    </div>
                 </div>
              </div>
            </section>

            </TabsContent>

            <TabsContent value="design" className="p-0 mt-0 outline-none">
              <DesignEditor />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Esports Neon Style Publish Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
              {/* Overlay background click to close */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 cursor-default"
                onClick={() => !isPublishing && setIsModalOpen(false)}
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-[0_0_50px_rgba(16,185,129,0.15)] z-10"
              >
                {/* Close Button */}
                {!isPublishing && (
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                <div className="flex flex-col gap-6">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-100 uppercase tracking-wider">Publish Campaign</h3>
                      <p className="text-[10px] text-zinc-500">Deploy your form to the cloud</p>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-900" />

                  {/* Content based on state */}
                  {isPublishing ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                      <div className="text-center">
                        <span className="text-sm font-semibold text-zinc-300">Publishing to cloud...</span>
                        <p className="text-[10px] text-zinc-500 mt-1">Configuring database and generating URL</p>
                      </div>
                    </div>
                  ) : pubError ? (
                    <div className="flex flex-col gap-4 py-2">
                      <div className="p-3 bg-red-950/20 border border-red-900/50 rounded text-xs text-red-400 leading-relaxed font-mono">
                        <span className="font-bold block mb-1">Error Occurred:</span>
                        {pubError}
                      </div>
                      <Button 
                        onClick={handlePublish} 
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                      >
                        Retry Publish
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 py-2">
                      <div className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded p-4">
                        <span className="text-sm font-bold text-emerald-400 block mb-1">Form Live!</span>
                        <p className="text-xs text-zinc-400">Your Esports tournament form is now globally accessible.</p>
                      </div>

                      <div className="space-y-1.5 mt-2">
                        <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Public URL</Label>
                        <div className="flex gap-2">
                          <Input 
                            readOnly 
                            value={publishedUrl} 
                            className="bg-zinc-900 border-zinc-800 text-xs font-mono select-all text-zinc-300"
                          />
                          <Button 
                            onClick={copyToClipboard}
                            size="icon"
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-emerald-400 shrink-0"
                          >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        {copied && (
                          <p className="text-[10px] text-emerald-400 font-semibold tracking-wide animate-pulse">
                            Copied to clipboard!
                          </p>
                        )}
                      </div>

                      <div className="flex gap-3 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsModalOpen(false)}
                          className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        >
                          Back to Editor
                        </Button>
                        <Button 
                          onClick={() => window.open(publishedUrl, '_blank')}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold"
                        >
                          Visit Form
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }
