import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'checkbox';
  required: boolean;
}

const initialFields: FormField[] = [
  { id: '1', label: 'Company Name', type: 'text', required: true },
  { id: '2', label: 'Contact Person', type: 'text', required: true },
  { id: '3', label: 'Email Address', type: 'email', required: true },
  { id: '4', label: 'Your Message', type: 'textarea', required: true },
  { id: '5', label: 'Consent', type: 'checkbox', required: true },
];

const FormBuilder = () => {
  const [fields, setFields] = useState(initialFields);
  const [consentLabel, setConsentLabel] = useState('I agree to the processing of my personal data.');
  const [submitLabel, setSubmitLabel] = useState('Send Request');
  const [successMsg, setSuccessMsg] = useState('Thank you for your message. We will contact you shortly.');

  const addField = () => setFields(fs => [...fs, { id: Date.now().toString(), label: 'New Field', type: 'text', required: false }]);
  const removeField = (id: string) => setFields(fs => fs.filter(f => f.id !== id));
  const updateField = (id: string, key: keyof FormField, val: string | boolean) => setFields(fs => fs.map(f => f.id === id ? { ...f, [key]: val } : f));

  const inputClass = "w-full border border-input rounded px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Form Builder</h1>
        <button onClick={addField} className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Add Field
        </button>
      </div>

      <div className="space-y-2 mb-8">
        {fields.map(f => (
          <div key={f.id} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <input value={f.label} onChange={e => updateField(f.id, 'label', e.target.value)} className="flex-1 border border-input rounded px-2 py-1.5 text-sm bg-card text-foreground" />
            <select value={f.type} onChange={e => updateField(f.id, 'type', e.target.value)} className="border border-input rounded px-2 py-1.5 text-sm bg-card text-foreground">
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="textarea">Textarea</option>
              <option value="checkbox">Checkbox</option>
            </select>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <input type="checkbox" checked={f.required} onChange={e => updateField(f.id, 'required', e.target.checked)} className="rounded" />
              Req
            </label>
            <button onClick={() => removeField(f.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <h2 className="font-heading font-semibold text-foreground">Form Settings</h2>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Consent Label</label>
          <input value={consentLabel} onChange={e => setConsentLabel(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Submit Button Label</label>
          <input value={submitLabel} onChange={e => setSubmitLabel(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Success Message</label>
          <input value={successMsg} onChange={e => setSuccessMsg(e.target.value)} className={inputClass} />
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
