import { useState } from 'react';
import { FileText, LayoutGrid, Menu, FormInput, Search, Globe, Users, Inbox } from 'lucide-react';

const menuItems = [
  { key: 'pages', label: 'Pages', icon: FileText },
  { key: 'blocks', label: 'Blocks / Builder', icon: LayoutGrid },
  { key: 'menu', label: 'Menu', icon: Menu },
  { key: 'forms', label: 'Forms', icon: FormInput },
  { key: 'seo', label: 'SEO', icon: Search },
  { key: 'languages', label: 'Languages', icon: Globe },
  { key: 'users', label: 'Users / Roles', icon: Users },
  { key: 'inquiries', label: 'Inquiries', icon: Inbox },
] as const;

export type CmsView = (typeof menuItems)[number]['key'];

const CmsSidebar = ({ active, onNavigate }: { active: CmsView; onNavigate: (v: CmsView) => void }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && <span className="font-heading font-bold text-sm text-sidebar-primary">ClearContent CMS</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring" aria-label="Toggle sidebar">
          <Menu className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex-1 py-2 space-y-0.5">
        {menuItems.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
              active === item.key
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default CmsSidebar;
