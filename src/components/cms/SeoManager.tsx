import { useState } from 'react';

const SeoManager = () => {
  const [lang, setLang] = useState<'en' | 'et'>('en');
  const [titles, setTitles] = useState({ en: 'GasTrade Pro — Reliable Refrigerant Gas Trading Partner', et: 'GasTrade Pro — Usaldusväärne külmagaasi kaubanduspartner' });
  const [descs, setDescs] = useState({ en: 'We supply high-quality refrigerant gases for HVAC, refrigeration, and industrial applications.', et: 'Tarnime kvaliteetseid külmagaase HVAC, külmutus- ja tööstusrakendustele.' });

  const inputClass = "w-full border border-input rounded px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">SEO Manager</h1>
      <div className="flex gap-2 mb-6">
        {(['en', 'et'] as const).map(l => (
          <button key={l} onClick={() => setLang(l)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${lang === l ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Page Title ({lang.toUpperCase()})</label>
          <input value={titles[lang]} onChange={e => setTitles({ ...titles, [lang]: e.target.value })} className={inputClass} />
          <p className="text-xs text-muted-foreground mt-1">{titles[lang].length}/60 characters</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Meta Description ({lang.toUpperCase()})</label>
          <textarea value={descs[lang]} onChange={e => setDescs({ ...descs, [lang]: e.target.value })} rows={3} className={inputClass} />
          <p className="text-xs text-muted-foreground mt-1">{descs[lang].length}/160 characters</p>
        </div>
      </div>
    </div>
  );
};

export default SeoManager;
