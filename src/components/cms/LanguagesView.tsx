import { useState } from 'react';

const LanguagesView = () => {
  const [langs, setLangs] = useState([
    { code: 'en', name: 'English', enabled: true },
    { code: 'et', name: 'Estonian', enabled: true },
  ]);
  const [previewLang, setPreviewLang] = useState('en');

  const toggle = (code: string) => setLangs(ls => ls.map(l => l.code === code ? { ...l, enabled: !l.enabled } : l));

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Languages</h1>
      <div className="space-y-3 mb-8">
        {langs.map(l => (
          <div key={l.code} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <span className="font-medium text-foreground">{l.name}</span>
              <span className="text-muted-foreground text-sm ml-2">({l.code})</span>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={l.enabled} onChange={() => toggle(l.code)} className="rounded" />
              <span className="text-muted-foreground">Enabled</span>
            </label>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="font-heading font-semibold text-foreground mb-3">Preview Language</h2>
        <select value={previewLang} onChange={e => setPreviewLang(e.target.value)} className="border border-input rounded px-3 py-2 text-sm bg-card text-foreground">
          {langs.filter(l => l.enabled).map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>
    </div>
  );
};

export default LanguagesView;
