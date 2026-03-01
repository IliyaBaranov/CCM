import { useState } from 'react';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  anchor: string;
  enabled: boolean;
}

const initialMenu: MenuItem[] = [
  { id: '1', label: 'About Us', anchor: '#about', enabled: true },
  { id: '2', label: 'What We Offer', anchor: '#offers', enabled: true },
  { id: '3', label: 'Contact', anchor: '#contact', enabled: true },
];

const MenuEditor = () => {
  const [items, setItems] = useState(initialMenu);

  const toggle = (id: string) => setItems(is => is.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  const updateLabel = (id: string, label: string) => setItems(is => is.map(i => i.id === id ? { ...i, label } : i));
  const updateAnchor = (id: string, anchor: string) => setItems(is => is.map(i => i.id === id ? { ...i, anchor } : i));

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Menu Editor</h1>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className={`bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3 ${!item.enabled ? 'opacity-50' : ''}`}>
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <input value={item.label} onChange={e => updateLabel(item.id, e.target.value)} className="flex-1 border border-input rounded px-2 py-1.5 text-sm bg-card text-foreground" />
            <input value={item.anchor} onChange={e => updateAnchor(item.id, e.target.value)} className="w-32 border border-input rounded px-2 py-1.5 text-sm bg-card text-muted-foreground" />
            <button onClick={() => toggle(item.id)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Toggle">
              {item.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuEditor;
