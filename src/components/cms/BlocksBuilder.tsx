import { useState } from 'react';
import { GripVertical, Plus, Copy, Eye, EyeOff, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Block {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  spacing: string;
  alignment: string;
  bgType: 'solid' | 'gradient';
  bgValue: string;
  typography: string;
}

const initialBlocks: Block[] = [
  { id: '1', type: 'hero', label: 'Hero Section', visible: true, spacing: 'large', alignment: 'left', bgType: 'gradient', bgValue: 'Navy → Teal', typography: 'heading-xl' },
  { id: '2', type: 'text', label: 'About Us', visible: true, spacing: 'large', alignment: 'left', bgType: 'solid', bgValue: 'White', typography: 'body-lg' },
  { id: '3', type: 'list', label: 'What We Offer', visible: true, spacing: 'large', alignment: 'left', bgType: 'solid', bgValue: 'Muted', typography: 'body-lg' },
  { id: '4', type: 'form', label: 'Contact Form', visible: true, spacing: 'large', alignment: 'left', bgType: 'solid', bgValue: 'White', typography: 'body-md' },
];

const BlocksBuilder = () => {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleVisibility = (id: string) => setBlocks(bs => bs.map(b => b.id === id ? { ...b, visible: !b.visible } : b));
  const duplicateBlock = (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (block) setBlocks(bs => [...bs, { ...block, id: Date.now().toString(), label: block.label + ' (copy)' }]);
  };
  const removeBlock = (id: string) => setBlocks(bs => bs.filter(b => b.id !== id));
  const moveBlock = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex(b => b.id === id);
    if ((dir === -1 && i === 0) || (dir === 1 && i === blocks.length - 1)) return;
    const next = [...blocks];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setBlocks(next);
  };
  const updateBlock = (id: string, field: keyof Block, value: string) => setBlocks(bs => bs.map(b => b.id === id ? { ...b, [field]: value } : b));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Blocks / Builder</h1>
        <button className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Add Block
        </button>
      </div>
      <div className="space-y-2">
        {blocks.map((block, idx) => (
          <div key={block.id} className={`bg-card border border-border rounded-lg ${!block.visible ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2 px-4 py-3">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <span className="flex-1 font-medium text-sm text-foreground">{block.label}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{block.type}</span>
              <button onClick={() => moveBlock(block.id, -1)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Move up"><ChevronUp className="h-4 w-4" /></button>
              <button onClick={() => moveBlock(block.id, 1)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Move down"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={() => duplicateBlock(block.id)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
              <button onClick={() => toggleVisibility(block.id)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Toggle visibility">{block.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
              <button onClick={() => removeBlock(block.id)} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
              <button onClick={() => setExpandedId(expandedId === block.id ? null : block.id)} className="text-xs text-accent hover:underline ml-1">Settings</button>
            </div>
            {expandedId === block.id && (
              <div className="border-t border-border px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Spacing</label>
                  <select value={block.spacing} onChange={e => updateBlock(block.id, 'spacing', e.target.value)} className="w-full border border-input rounded px-2 py-1.5 text-sm bg-card text-foreground">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Alignment</label>
                  <select value={block.alignment} onChange={e => updateBlock(block.id, 'alignment', e.target.value)} className="w-full border border-input rounded px-2 py-1.5 text-sm bg-card text-foreground">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Background</label>
                  <select value={block.bgType} onChange={e => updateBlock(block.id, 'bgType', e.target.value)} className="w-full border border-input rounded px-2 py-1.5 text-sm bg-card text-foreground">
                    <option value="solid">Solid</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Typography</label>
                  <select value={block.typography} onChange={e => updateBlock(block.id, 'typography', e.target.value)} className="w-full border border-input rounded px-2 py-1.5 text-sm bg-card text-foreground">
                    <option value="heading-xl">Heading XL</option>
                    <option value="heading-lg">Heading LG</option>
                    <option value="body-lg">Body LG</option>
                    <option value="body-md">Body MD</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlocksBuilder;
