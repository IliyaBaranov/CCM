const InquiriesView = () => (
  <div>
    <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Inquiries</h1>
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-border">
            <td className="px-4 py-3">Acme HVAC Ltd.</td>
            <td className="px-4 py-3">John Smith</td>
            <td className="px-4 py-3 text-muted-foreground">john@acmehvac.com</td>
            <td className="px-4 py-3 text-muted-foreground">2026-02-27</td>
            <td className="px-4 py-3"><span className="bg-accent/15 text-accent text-xs font-medium px-2 py-0.5 rounded">New</span></td>
          </tr>
          <tr className="border-t border-border">
            <td className="px-4 py-3">Nordic Cool OÜ</td>
            <td className="px-4 py-3">Mari Tamm</td>
            <td className="px-4 py-3 text-muted-foreground">mari@nordiccool.ee</td>
            <td className="px-4 py-3 text-muted-foreground">2026-02-25</td>
            <td className="px-4 py-3"><span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded">Read</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default InquiriesView;
