import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Sparkles, Save, Trash2 } from 'lucide-react';

export function DesignEditor() {
  const { formConfig, updateTheme, plan, savedDesigns, saveCurrentDesign, loadDesign, deleteDesign } = useAppStore();
  const theme = formConfig.theme;
  const [newDesignName, setNewDesignName] = useState('');

  const handleSaveDesign = () => {
    if (newDesignName.trim()) {
      saveCurrentDesign(newDesignName);
      setNewDesignName('');
    }
  };

  const handleColorChange = (key: keyof typeof theme.colors, value: string) => {
    updateTheme((t) => ({ ...t, colors: { ...t.colors, [key]: value } }));
  };

  const handleBgChange = (key: keyof typeof theme.background, value: any) => {
    updateTheme((t) => ({ ...t, background: { ...t.background, [key]: value } }));
  };
  
  const handleEffectsChange = (key: keyof typeof theme.effects, value: any) => {
    updateTheme((t) => ({ ...t, effects: { ...t.effects, [key]: value } }));
  };

  return (
    /* ==========================================================================
       【デザインエディターパネル全体】
       背景、配色、フォント、ガラス効果などを細かくカスタマイズするためのUI群です。
       ========================================================================== */
    <div className="flex flex-col gap-8 p-4">
      
      {/* --------------------------------------------------------------------------
          ① Saved Designs（デザインプリセットの保存と読み込み・削除）
          - 作成した独自デザインに名前をつけてローカルに保存したり、呼び出したりできます。
          -------------------------------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest flex items-center justify-between">
           Saved Designs
           {plan === 'free' && <span className="text-[10px] text-zinc-500 font-normal normal-case">Pro to share</span>}
        </h3>
        
        <div className="space-y-3">
           {/* デザイン名入力 ＆ 保存ボタン */}
           <div className="flex gap-2">
             <Input 
                placeholder="Design Name..." 
                className="bg-zinc-900 border-zinc-800 text-xs h-8"
                value={newDesignName}
                onChange={(e) => setNewDesignName(e.target.value)}
             />
             <Button size="sm" onClick={handleSaveDesign} className="h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
               <Save className="w-3.5 h-3.5 mr-1.5" /> Save
             </Button>
           </div>

           {/* 保存されたプリセット一覧カードのループ表示 */}
           <div className="space-y-2 mt-4">
              {savedDesigns.map(design => (
                 <div key={design.id} className="flex items-center justify-between bg-zinc-900/50 p-2 rounded border border-zinc-800 group transition-colors hover:bg-zinc-900">
                    <div className="flex flex-col">
                       <span className="text-xs font-medium text-zinc-300">{design.name}</span>
                       <span className="text-[9px] text-zinc-500">
                          {new Date(design.updatedAt).toLocaleDateString()}
                       </span>
                    </div>
                    {/* ホバー時に出現する「適用(Apply)」および「削除」ボタン */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => loadDesign(design.id)}>
                         Apply
                       </Button>
                       <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => deleteDesign(design.id)}>
                         <Trash2 className="w-3 h-3" />
                       </Button>
                    </div>
                 </div>
              ))}
           </div>
         </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* --------------------------------------------------------------------------
          ② Background Engine（背景デザインの選択・調整）
          - 単色、グラデーション、背景画像(GIF)、さらにはビデオ背景の設定を統合的に制御します。
          -------------------------------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest">Background Engine</h3>
        
        {/* 背景タイプのプルダウン選択肢 */}
        <div className="space-y-3">
          <Label className="text-xs text-zinc-400">Background Type</Label>
          <Select 
            value={theme.background.type} 
            onValueChange={(val: any) => handleBgChange('type', val)}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="color">Solid Color</SelectItem>
              <SelectItem value="gradient">Gradient</SelectItem>
              <SelectItem value="image">Image / GIF</SelectItem>
              <SelectItem value="video" disabled={plan === 'free'}>
                 <div className="flex items-center gap-2">
                    Video Background
                    {plan === 'free' && <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded text-[9px] font-bold uppercase"><Lock className="w-2.5 h-2.5"/> Pro</div>}
                 </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {theme.background.type === 'video' && plan === 'pro' && (
          <div className="space-y-3">
            <Label className="text-xs text-zinc-400">Video URL (MP4/WebM)</Label>
            <Input 
              value={theme.background.videoUrl} 
              onChange={(e) => handleBgChange('videoUrl', e.target.value)}
              className="bg-zinc-900 border-zinc-800"
              placeholder="https://example.com/video.mp4"
            />
          </div>
        )}

        {theme.background.type === 'color' && (
          <div className="space-y-3">
            <Label className="text-xs text-zinc-400">Base Color</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                value={theme.background.baseColor} 
                onChange={(e) => handleBgChange('baseColor', e.target.value)}
                className="w-12 h-10 p-1 bg-zinc-900 border-zinc-800 cursor-pointer"
              />
              <Input 
                type="text" 
                value={theme.background.baseColor} 
                onChange={(e) => handleBgChange('baseColor', e.target.value)}
                className="flex-1 bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>
        )}

        {theme.background.type === 'gradient' && (
          <div className="space-y-3">
            <Label className="text-xs text-zinc-400">CSS Gradient</Label>
            <Input 
              value={theme.background.gradient} 
              onChange={(e) => handleBgChange('gradient', e.target.value)}
              className="bg-zinc-900 border-zinc-800 font-mono text-xs"
            />
          </div>
        )}
        
        {theme.background.type === 'image' && (
          <div className="space-y-3">
            <Label className="text-xs text-zinc-400">Image URL</Label>
            <Input 
              value={theme.background.imageUrl} 
              onChange={(e) => handleBgChange('imageUrl', e.target.value)}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
        )}

        <div className="space-y-4 pt-2">
           <div className="space-y-2">
              <div className="flex justify-between">
                 <Label className="text-xs text-zinc-400">Overlay Opacity</Label>
                 <span className="text-xs text-zinc-500">{theme.background.overlayOpacity.toFixed(2)}</span>
              </div>
              <Slider 
                 value={[theme.background.overlayOpacity]} 
                 min={0} max={1} step={0.05}
                 onValueChange={(val: any) => handleBgChange('overlayOpacity', Array.isArray(val) ? val[0] : val)}
              />
           </div>
           
           <div className="space-y-2">
              <div className="flex justify-between">
                 <Label className="text-xs text-zinc-400">Noise Opacity</Label>
                 <span className="text-xs text-zinc-500">{theme.background.noiseOpacity.toFixed(2)}</span>
              </div>
              <Slider 
                 value={[theme.background.noiseOpacity]} 
                 min={0} max={0.5} step={0.01}
                 onValueChange={(val: any) => handleBgChange('noiseOpacity', Array.isArray(val) ? val[0] : val)}
              />
           </div>
           
            <div className="space-y-2">
              <div className="flex justify-between">
                 <Label className="text-xs text-zinc-400">Backdrop Blur (px)</Label>
                 <span className="text-xs text-zinc-500">{theme.background.blur}</span>
              </div>
              <Slider 
                 value={[theme.background.blur]} 
                 min={0} max={40} step={1}
                 onValueChange={(val: any) => handleBgChange('blur', Array.isArray(val) ? val[0] : val)}
              />
           </div>
        </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* --------------------------------------------------------------------------
          ③ Brand Colors（カラーテーマの選択）
          - 各フォームの背景、文字色、ボーダー、プレースホルダーなどのカラーパレットを定義します。
          -------------------------------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest">Brand Colors</h3>
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker label="Primary (ボタン背景など)" value={theme.colors.primary} onChange={(v) => handleColorChange('primary', v)} />
          <ColorPicker label="Accent (強調箇所など)" value={theme.colors.accent} onChange={(v) => handleColorChange('accent', v)} />
          <ColorPicker label="Surface (フォームカード背景)" value={theme.colors.surface} onChange={(v) => handleColorChange('surface', v)} />
          <ColorPicker label="Input Base (入力枠背景)" value={theme.colors.input} onChange={(v) => handleColorChange('input', v)} />
          <ColorPicker label="Text (Primary / 主な文字色)" value={theme.colors.textPrimary} onChange={(v) => handleColorChange('textPrimary', v)} />
          <ColorPicker label="Text (Secondary / 補足文字色)" value={theme.colors.textSecondary} onChange={(v) => handleColorChange('textSecondary', v)} />
          <ColorPicker label="Placeholder (薄いガイド文字)" value={theme.colors.placeholder} onChange={(v) => handleColorChange('placeholder', v)} />
          <ColorPicker label="Border (枠線)" value={theme.colors.border} onChange={(v) => handleColorChange('border', v)} />
        </div>
      </section>
      
      <div className="h-px bg-zinc-800" />

      {/* --------------------------------------------------------------------------
          ④ Typography（フォント設定）
          - 見出しと本文のそれぞれに適用するフォントファミリーを選択します。
          -------------------------------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest">Typography</h3>
        {/* 見出しフォント */}
        <div className="space-y-3">
          <Label className="text-xs text-zinc-400">Heading Font</Label>
          <Select 
            value={theme.typography.headingFontFamily} 
            onValueChange={(val: string | null) => { if (val) updateTheme((t) => ({ ...t, typography: { ...t.typography, headingFontFamily: val } })) }}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-800">
               <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
               <SelectItem value='"Space Grotesk", sans-serif'>Space Grotesk</SelectItem>
               <SelectItem value='"Inter", sans-serif'>Inter</SelectItem>
               <SelectItem value='"Playfair Display", serif'>Playfair Display</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* 本文・説明文・入力欄フォント */}
        <div className="space-y-3">
          <Label className="text-xs text-zinc-400">Body Font</Label>
          <Select 
            value={theme.typography.fontFamily} 
            onValueChange={(val: string | null) => { if (val) updateTheme((t) => ({ ...t, typography: { ...t.typography, fontFamily: val } })) }}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-800">
               <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
               <SelectItem value='"Inter", sans-serif'>Inter</SelectItem>
               <SelectItem value='"JetBrains Mono", monospace'>JetBrains Mono</SelectItem>
               <SelectItem value='"Space Grotesk", sans-serif'>Space Grotesk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* --------------------------------------------------------------------------
          ⑤ Effects & Style（ガラスエフェクト・デザインの質感）
          - 半透明のガラス効果（Glassmorphism）、入力欄の枠線の形状、カードの角丸（Card Radius）を設定します。
          -------------------------------------------------------------------------- */}
      <section className="space-y-4 pb-12">
        <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest">Effects & Style</h3>
        
        {/* ガラス効果（Glassmorphism）のON/OFF切り替え */}
        <div className="flex items-center justify-between">
           <Label className="text-sm text-zinc-300">Glassmorphism</Label>
           <Switch checked={theme.effects.glassmorphism} onCheckedChange={(v) => handleEffectsChange('glassmorphism', v)} />
        </div>
        
        {/* 入力欄のスタイル設定（塗りつぶし / アウトライン / 下線のみ） */}
        <div className="space-y-3 mt-4">
          <Label className="text-xs text-zinc-400">Input Style</Label>
          <Select 
            value={theme.effects.inputStyle} 
            onValueChange={(val: any) => handleEffectsChange('inputStyle', val)}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="solid">Solid (塗りつぶし)</SelectItem>
              <SelectItem value="outline">Outline (枠線のみ)</SelectItem>
              <SelectItem value="underlined">Underlined (下線のみ)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* フォームカードの角丸（Card Radius）設定（角張る / 小 / 中 / 大） */}
        <div className="space-y-3 mt-4">
          <Label className="text-xs text-zinc-400">Card Radius (角丸の強さ)</Label>
          <Select 
            value={theme.effects.cardRadius} 
            onValueChange={(val: any) => handleEffectsChange('cardRadius', val)}
          >
             <SelectTrigger className="bg-zinc-900 border-zinc-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="0px">Sharp (角張る)</SelectItem>
              <SelectItem value="0.5rem">Small (少し丸い)</SelectItem>
              <SelectItem value="1rem">Medium (中間)</SelectItem>
              <SelectItem value="1.5rem">Large (大きく丸い)</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </section>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
     <div className="space-y-1.5 flex flex-col">
       <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
       <div className="flex gap-2 items-center">
         <div className="relative w-8 h-8 rounded shrink-0 overflow-hidden border border-zinc-700 select-none cursor-pointer group">
            <input 
               type="color" 
               value={value} 
               onChange={(e) => onChange(e.target.value)}
               className="absolute -inset-2 w-12 h-12 cursor-pointer"
            />
         </div>
         <Input 
           value={value}
           onChange={(e) => onChange(e.target.value)}
           className="h-8 text-xs bg-zinc-900 border-zinc-800 px-2"
         />
       </div>
     </div>
  )
}
