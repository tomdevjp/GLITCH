import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormConfig, Question, ThemeTokens } from '../types';
import { useThemeStyles, NoiseOverlay } from '../lib/design-system';
import { useAppStore } from '../store';

/**
 * GLITCH フォームレンダラーコンポーネント
 * 
 * 【手動カスタマイズを行う方へ】
 * フォーム全体のレイアウト、余白、最大幅、文字サイズ、アニメーションなどを手動で調整したい場合は、
 * 各セクションに記載されている【レイアウト調整ポイント】のコメントを参考に、TailwindのクラスやCSS変数を書き換えてください。
 */
export function Renderer({ 
  config, 
  isPreview = false,
  onSubmit 
}: { 
  config: FormConfig; 
  isPreview?: boolean;
  onSubmit?: (answers: Record<string, any>) => Promise<void>;
}) {
  const { plan } = useAppStore();
  const styles = useThemeStyles(config.theme);
  const { theme, hero, questions, settings } = config;

  // フォームの入力状態管理用のステート
  const [answers, setAnswers] = React.useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // 入力された値をステートに格納するハンドラー
  const handleInputChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // 送信処理ハンドラー
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // 必須項目のバリデーションチェック
    const missingFields = questions.filter(q => q.required && !answers[q.id]);
    if (missingFields.length > 0) {
      setSubmitError(`必須項目を入力してください: ${missingFields.map(f => f.title).join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isPreview) {
        // プレビュー時は1.5秒待機して成功をシミュレート
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else if (onSubmit) {
        await onSubmit(answers);
      }
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Submit error:', err);
      setSubmitError(err.message || '送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* --------------------------------------------------------------------------
       1. フォーム全体を囲む最外枠ラッパー
       --------------------------------------------------------------------------
       【レイアウト調整ポイント】
       - `min-h-full w-full h-full`: 親要素いっぱいに広げてスクロールを有効にしています。
       - `text-[var(--color-text-primary)]`: テーマカラーで設定されたメイン文字色を適用しています。
    */
    <div 
      className="relative min-h-full w-full h-full overflow-y-auto overflow-x-hidden font-sans text-[var(--color-text-primary)]"
      style={{
        ...styles,
        fontFamily: 'var(--font-family)',
      }}
    >
      {/* --------------------------------------------------------------------------
         2. 背景レイヤーエンジン（ベース色、グラデーション、画像、動画、オーバーレイ、ノイズ）
         --------------------------------------------------------------------------
         【レイアウト調整ポイント】
         - 背景の重ね順は `z-[-1]`（最背面）で制御しています。
         - `backdropFilter` によるブラー（ぼかし）やオーバーレイの不透明度（opacity）を動的に反映します。
      */}
      <div className="absolute inset-0 z-[-1] pointer-events-none">
        {/* レイヤー1: ソリッド単色背景 */}
        <div className="absolute inset-0 bg-[var(--bg-base-color)]" />
        
        {/* レイヤー2: CSSグラデーション背景 */}
        {theme.background.type === 'gradient' && (
          <div 
            className="absolute inset-0"
            style={{ background: 'var(--bg-gradient)' }}
          />
        )}
        
        {/* レイヤー3: 画像 / GIF 背景 */}
        {theme.background.type === 'image' && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'var(--bg-image)' }}
          />
        )}

        {/* レイヤー4: 動画背景 (Proプラン専用) */}
        {theme.background.type === 'video' && plan === 'pro' && theme.background.videoUrl && (
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src={theme.background.videoUrl}
          />
        )}
        
        {/* レイヤー5: オーバーレイ色 ＆ 背面ぼかしブラー */}
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundColor: 'var(--bg-overlay-color)',
            opacity: 'var(--bg-overlay-opacity)',
            backdropFilter: `blur(var(--bg-blur))`,
            WebkitBackdropFilter: `blur(var(--bg-blur))`
          }}
        />

        {/* レイヤー6: アナログ風ノイズエフェクト */}
        <NoiseOverlay opacity={theme.background.noiseOpacity} />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center">
        {/* --------------------------------------------------------------------------
           3. ヒーローセクション（ロゴ、特大タイトル、説明文）
           --------------------------------------------------------------------------
           【レイアウト調整ポイント】
           - `max-w-4xl`: ヒーロー表示エリアの最大幅です。
           - `py-16`/`min-h-[60svh]`/`min-h-[100svh]`: ヒーローの高さ設定（高さ自動/大/画面全体）を制御しています。
           - タイトルと説明文の配置位置（左寄せ/中央寄せ/右寄せ）は `hero.alignment` から自動で適用されます。
        */}
        {hero.enabled && !isSubmitted && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`w-full max-w-4xl px-6 flex flex-col justify-center ${
              hero.height === 'screen' ? 'min-h-[100svh] py-12' : hero.height === 'large' ? 'min-h-[60svh] py-10' : 'py-8'
            }`}
            style={{
              alignItems: hero.alignment === 'center' ? 'center' : hero.alignment === 'right' ? 'flex-end' : 'flex-start',
              textAlign: hero.alignment
            }}
          >
            {/* チームロゴ画像 */}
            {hero.logoUrl && (
              <img src={hero.logoUrl} alt="Logo" className="mb-6 max-h-24 object-contain shadow-2xl" />
            )}
            
            {/* ヒーロータイトル (特大文字) */}
            <h1 
              className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-balance drop-shadow-lg"
              style={{ fontFamily: 'var(--font-family-heading)' }}
            >
              {hero.title}
            </h1>
            
            {/* ヒーロー説明文 */}
            {hero.description && (
              <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl text-balance drop-shadow-md">
                {hero.description}
              </p>
            )}
          </motion.div>
        )}

        {/* --------------------------------------------------------------------------
           4. フォームコンテナ（カード本体）
           --------------------------------------------------------------------------
           【レイアウト調整ポイント】
           - `max-w-2xl`: フォーム全体の横幅です。もう少し細くしたい場合は `max-w-xl` などに変更してください。
           - `p-6 md:p-8`: 内側の余白です。PCとスマホで自動的に余白が変わるようになっています。
           - `gap-8`: 各設問間の間隔（縦方向の隙間）です。ここをいじることで詰まり具合を調整できます。
           - `theme.effects.glassmorphism`: ガラスモーフィズムがオンの時は、半透明背景(`bg-surface/60`)と強力なブラー(`backdrop-blur-xl`)を適用します。
        */}
        <div className={`w-full max-w-2xl px-4 pb-24 ${isSubmitted ? 'pt-24' : ''}`}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`flex flex-col gap-8 p-6 md:p-8 border shadow-xl ${
              theme.effects.glassmorphism ? 'backdrop-blur-xl bg-[var(--color-surface)]/60' : 'bg-[var(--color-surface)]'
            }`}
            style={{
              borderColor: 'var(--color-border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-effect)',
            }}
          >
            {isSubmitted ? (
              /* ==========================================
                 A. 送信完了画面 (サンクスページ)
                 ==========================================
                 【レイアウト調整ポイント】
                 - `py-12`: 送信完了カードの内側の縦余白。
                 - `w-16 h-16`: チェックマークアイコンの丸枠サイズ。
              */
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 flex flex-col items-center gap-4"
              >
                {/* 弾むアニメーション付きチェックマーク */}
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 animate-bounce">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                {/* サンクスメッセージタイトル */}
                <h2 className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'var(--font-family-heading)' }}>
                  送信が完了しました
                </h2>
                
                {/* サンクスメッセージ詳細 (設定値) */}
                <p className="text-sm text-[var(--color-text-secondary)] max-w-md text-balance leading-relaxed">
                  {settings.successMessage || '回答が正常に送信され、安全に保管されました。ご協力ありがとうございました。'}
                </p>
                
                {/* プレビュー表示時のデモ用ラベル */}
                {isPreview && (
                  <span className="mt-4 px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                    Preview Mode (Demo Only)
                  </span>
                )}
              </motion.div>
            ) : (
              /* ==========================================
                 B. フォーム入力フォーム本体
                 ========================================== */
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
                
                {/* 各質問フィールドのループ展開 */}
                {questions.map((q, index) => (
                  <RendererQuestion 
                    key={q.id} 
                    question={q} 
                    index={index} 
                    theme={theme} 
                    value={answers[q.id] || ''}
                    onChange={(val) => handleInputChange(q.id, val)}
                  />
                ))}

                {/* 必須未入力などのエラーメッセージ表示枠 */}
                {submitError && (
                  <div className="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded text-xs text-[var(--color-error)]">
                    {submitError}
                  </div>
                )}

                {/* --------------------------------------------------------------------------
                   5. 送信ボタンエリア
                   --------------------------------------------------------------------------
                   【レイアウト調整ポイント】
                   - `pt-4 mt-4 border-t`: フォームとボタンの間の仕切り線と余白です。
                   - `px-6 py-3`: ボタンの大きさ・内側余白です。
                   - `hover:scale-[1.02] active:scale-[0.98]`: ホバー時やクリック時の微細な拡大・縮小アニメーションです。
                   - `hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]`: ホバー時にネオン風に外光がグローする演出です。
                */}
                <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                   <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] px-6 py-3 cursor-pointer flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: '#ffffff',
                        borderRadius: 'var(--radius-button)',
                        opacity: isSubmitting ? 0.7 : 1,
                      }}
                   >
                     {isSubmitting ? '送信中...' : settings.submitLabel}
                   </button>
                </div>
              </form>
            )}
          </motion.div>

          {/* --------------------------------------------------------------------------
             6. フッターブランディング (GLITCH クレジット表示)
             --------------------------------------------------------------------------
             【レイアウト調整ポイント】
             - Freeプランでは強制表示され、ProプランではSettingsから非表示にできます。
             - `mt-12 text-center pb-8 opacity-50 hover:opacity-100`: 余白と透過度設定です。ホバー時にくっきり白くなります。
          */}
          {(!settings.removeBranding || plan === 'free') && (
            <div className="mt-12 text-center pb-8 opacity-50 hover:opacity-100 transition-opacity">
               <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--color-text-secondary)' }}>
                 Powered by <span style={{ color: 'var(--color-text-primary)' }}>GLITCH</span>
               </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 各質問項目をレンダリングするコンポーネント (内部用)
 * 
 * 【手動カスタマイズを行う方へ】
 * 入力フィールド(input, textarea, select)やラジオボタンのレイアウト、フォーカス時のボーダー色、
 * プレースホルダーの文字色などを変更したい場合は、以下のクラス設定を書き換えてください。
 */
function RendererQuestion({ 
  question, 
  index, 
  theme,
  value,
  onChange
}: { 
  question: Question; 
  index: number; 
  theme: ThemeTokens;
  value: any;
  onChange: (val: any) => void;
}) {
  const isOutline = theme.effects.inputStyle === 'outline';
  const isUnderlined = theme.effects.inputStyle === 'underlined';

  // フォームフィールド背景色 (ガラスオンの時は半透明、オフの時はソリッド背景色)
  const inputBg = theme.effects.glassmorphism ? 'bg-[var(--color-input)]/50 backdrop-blur-sm' : 'bg-[var(--color-input)]';
  
  // 入力欄のボーダースタイル設定 (アンダーライン型、アウトライン型、またはフラット型)
  const inputBorder = isUnderlined 
    ? 'border-0 border-b-2 border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-none px-0' 
    : `border ${isOutline ? 'border-[var(--color-border)]' : 'border-transparent'} hover:border-[var(--color-border)]`;

  // 入力フィールド全体の標準的なTailwindクラスの組み合わせ
  // 【レイアウト調整ポイント】
  // `px-4 py-3`: 入力フィールドの内側余白 (文字の詰まり具合)
  // `focus:ring-2 focus:ring-[var(--color-primary)]`: フォーカスを当てた時のネオン風の外光枠線幅と色
  const inputClass = `w-full px-4 py-3 outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-placeholder)] transition-colors focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${inputBg} ${inputBorder}`;

  return (
    /* 各設問のフェードイン/スライドインアニメーション */
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="flex flex-col gap-2"
    >
      {/* 質問タイトル (設問ラベル) */}
      {/* 【レイアウト調整ポイント】 `text-sm font-semibold tracking-wide`: ラベル文字の太さ・サイズ */}
      <label className="text-sm font-semibold tracking-wide">
        {question.title} {question.required && <span className="text-[var(--color-error)] ml-1">*</span>}
      </label>
      
      {/* 設問の補助説明文 (description) */}
      {question.description && (
        <p className="text-xs text-[var(--color-text-secondary)] mb-1">{question.description}</p>
      )}

      {/* ==========================================================================
         設問タイプ1: 一行テキスト入力 (Short Text)
         ========================================================================== */}
      {question.type === 'shortText' && (
         <input 
            type="text" 
            placeholder={question.placeholder || "回答を入力してください"} 
            className={inputClass}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ borderRadius: isUnderlined ? '0' : 'var(--radius-button)' }}
         />
      )}

      {/* ==========================================================================
         設問タイプ2: 複数行テキスト入力 (Long Text)
         ==========================================================================
         【レイアウト調整ポイント】
         - `min-h-[100px]`: 縦幅の最小高さです。ここを変更することで高さを広げられます。
      */}
      {question.type === 'longText' && (
         <textarea 
            placeholder={question.placeholder || "回答を入力してください"} 
            className={`${inputClass} min-h-[100px] resize-y`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ borderRadius: isUnderlined ? '0' : 'var(--radius-button)' }}
         />
      )}
      
      {/* ==========================================================================
         設問タイプ3: URL入力 (Twitter/Xリンクなど)
         ========================================================================== */}
      {question.type === 'url' && (
         <input 
            type="url" 
            placeholder={question.placeholder || "https://"} 
            className={inputClass}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ borderRadius: isUnderlined ? '0' : 'var(--radius-button)' }}
         />
      )}

      {/* ==========================================================================
         設問タイプ4: 単一選択肢ラジオボタン (Single Choice / Radio)
         ==========================================================================
         【レイアウト調整ポイント】
         - `flex flex-col gap-2`: 選択肢同士の縦の隙間。
         - `p-3`: 選択カードの内側余白。
         - `value === opt`: 選択された選択肢カードの背景色(`bg-primary/10`)と枠線色(`border-primary`)を適用します。
      */}
      {question.type === 'singleChoice' && (
         <div className="flex flex-col gap-2 mt-1">
           {question.options?.map((opt, i) => (
             <label 
               key={i} 
               className={`flex items-center gap-3 p-3 cursor-pointer border border-[var(--color-border)] transition-colors hover:bg-[var(--color-border)]/30 ${theme.effects.glassmorphism ? 'backdrop-blur-sm' : ''} ${value === opt ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : ''}`} 
               style={{ borderRadius: 'var(--radius-button)' }}
             >
               <input 
                  type="radio" 
                  name={question.id} 
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="w-4 h-4 accent-[var(--color-primary)] bg-[var(--color-input)] border-[var(--color-border)]" 
               />
               <span className="text-sm">{opt}</span>
             </label>
           ))}
         </div>
      )}
      
      {/* ==========================================================================
         設問タイプ5: プルダウン選択肢 (Dropdown)
         ========================================================================== */}
      {question.type === 'dropdown' && (
         <select 
            className={inputClass}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ borderRadius: isUnderlined ? '0' : 'var(--radius-button)' }}
         >
           <option value="" disabled className="text-[var(--color-placeholder)]">{question.placeholder || "選択肢から選んでください"}</option>
           {question.options?.map((opt, i) => (
              <option key={i} value={opt} className="text-black">{opt}</option>
           ))}
         </select>
      )}
    </motion.div>
  );
}
