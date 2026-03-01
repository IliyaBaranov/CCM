import { FileText } from 'lucide-react';

const pages = [
  { name: 'Home', slug: '/', status: 'Published' },
];

const PagesView = () => (
  <div>
    <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Pages</h1>
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Page</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {pages.map(p => (
            <tr key={p.slug} className="border-t border-border">
              <td className="px-4 py-3 flex items-center gap-2"><FileText className="h-4 w-4 text-accent" />{p.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.slug}</td>
              <td className="px-4 py-3"><span className="bg-accent/15 text-accent text-xs font-medium px-2 py-0.5 rounded">{p.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default PagesView;
