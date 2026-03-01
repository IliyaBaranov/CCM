const roles = [
  { name: 'Superadmin', description: 'Full access to all CMS features and settings', count: 1 },
  { name: 'Admin', description: 'Manage content, forms, and users', count: 2 },
  { name: 'Editor', description: 'Edit and publish content only', count: 3 },
];

const UsersRoles = () => (
  <div>
    <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Users & Roles</h1>
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      {roles.map(r => (
        <div key={r.name} className="bg-card border border-border rounded-lg p-5">
          <h3 className="font-heading font-semibold text-foreground mb-1">{r.name}</h3>
          <p className="text-sm text-muted-foreground mb-3">{r.description}</p>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{r.count} user{r.count > 1 ? 's' : ''}</span>
        </div>
      ))}
    </div>
    <div className="bg-muted/50 border border-border rounded-lg p-8 text-center">
      <p className="text-muted-foreground">User management interface — coming soon</p>
    </div>
  </div>
);

export default UsersRoles;
