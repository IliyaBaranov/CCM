import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { envConfig, supabase } from '@/lib/supabase';
import { BlockRow, FormRow, InquiryRow, Json, MenuRow, PageRow, Role, SeoRow, UserRoleRow, getCurrentUserRole, insertAuditLog, loadSiteByTeamSlug, normalizeLanguageList, parseJsonObject } from '@/lib/cms-data';

type ViewKey = 'pages' | 'blocks' | 'menu' | 'forms' | 'seo' | 'languages' | 'users' | 'inquiries';
const views: Array<{ key: ViewKey; label: string }> = [
  { key: 'pages', label: 'Pages' },
  { key: 'blocks', label: 'Blocks / Builder' },
  { key: 'menu', label: 'Menu' },
  { key: 'forms', label: 'Forms' },
  { key: 'seo', label: 'SEO' },
  { key: 'languages', label: 'Languages' },
  { key: 'users', label: 'Users / Roles' },
  { key: 'inquiries', label: 'Inquiries' },
];

const fetchCmsSnapshot = async (teamSlug: string, userId: string) => {
  const { site } = await loadSiteByTeamSlug(teamSlug);
  const { isSuperadmin, role } = await getCurrentUserRole(userId, site.id);
  const canManageUsers = isSuperadmin || role === 'Admin';

  const [pagesRes, blocksRes, menuRes, formRes, seoRes, inquiriesRes, rolesRes] = await Promise.all([
    supabase.from('pages').select('*').eq('site_id', site.id).order('slug', { ascending: true }),
    supabase.from('blocks').select('*, pages!inner(site_id)').eq('pages.site_id', site.id).order('order_index', { ascending: true }),
    supabase.from('menus').select('*').eq('site_id', site.id).maybeSingle(),
    supabase.from('forms').select('*').eq('site_id', site.id).eq('key', 'contact').maybeSingle(),
    supabase.from('seo').select('*').eq('site_id', site.id).eq('slug', 'home').maybeSingle(),
    supabase.from('inquiries').select('*').eq('site_id', site.id).order('created_at', { ascending: false }).limit(100),
    canManageUsers ? supabase.from('user_roles').select('*').eq('site_id', site.id).order('id', { ascending: true }) : Promise.resolve({ data: [], error: null } as { data: UserRoleRow[]; error: null }),
  ]);

  if (pagesRes.error) throw pagesRes.error;
  if (blocksRes.error) throw blocksRes.error;
  if (menuRes.error) throw menuRes.error;
  if (formRes.error) throw formRes.error;
  if (seoRes.error) throw seoRes.error;
  if (inquiriesRes.error) throw inquiriesRes.error;
  if (rolesRes.error) throw rolesRes.error;

  return {
    site,
    role: (isSuperadmin ? 'Superadmin' : role) as Role,
    canEdit: isSuperadmin || role === 'Admin' || role === 'Editor',
    canManageUsers,
    pages: (pagesRes.data as PageRow[]) ?? [],
    blocks: ((blocksRes.data as Array<BlockRow & { pages?: { site_id: number } }>) ?? []).map(({ pages, ...block }) => block),
    menu: menuRes.data ?? null,
    form: formRes.data ?? null,
    seo: seoRes.data ?? null,
    inquiries: (inquiriesRes.data as InquiryRow[]) ?? [],
    userRoles: (rolesRes.data as UserRoleRow[]) ?? [],
  };
};

const CmsPanel = () => {
  const teamSlug = envConfig.teamSlug;
  const [view, setView] = useState<ViewKey>('pages');
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [menuDraft, setMenuDraft] = useState('[]');
  const [formDraft, setFormDraft] = useState('{}');
  const [enabledLanguagesDraft, setEnabledLanguagesDraft] = useState<string[]>(['en']);
  const [defaultLanguageDraft, setDefaultLanguageDraft] = useState('en');
  const [seoLang, setSeoLang] = useState('en');
  const [seoTitleDraft, setSeoTitleDraft] = useState('');
  const [seoDescriptionDraft, setSeoDescriptionDraft] = useState('');
  const [userIdDraft, setUserIdDraft] = useState('');
  const [userRoleDraft, setUserRoleDraft] = useState<'Admin' | 'Editor'>('Editor');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessionUserId(data.session?.user.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSessionUserId(nextSession?.user.id ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  const cmsQuery = useQuery({
    queryKey: ['cms', teamSlug, sessionUserId],
    queryFn: () => fetchCmsSnapshot(teamSlug, sessionUserId as string),
    enabled: !!sessionUserId,
    staleTime: 1000 * 30,
  });

  const data = cmsQuery.data;

  useEffect(() => {
    if (!data) return;
    const homePage = data.pages.find((page) => page.slug === 'home') ?? data.pages[0] ?? null;
    setSelectedPageId((prev) => (prev && data.pages.some((page) => page.id === prev) ? prev : homePage?.id ?? null));
    setMenuDraft(JSON.stringify(data.menu?.items ?? [], null, 2));
    setFormDraft(JSON.stringify(data.form?.schema ?? {}, null, 2));
    const langs = normalizeLanguageList(data.site.enabled_languages, data.site.default_language);
    setEnabledLanguagesDraft(langs);
    setDefaultLanguageDraft(data.site.default_language);
    const seoData = (data.seo?.data as Record<string, Record<string, string>>) ?? {};
    const selectedLang = langs.includes(seoLang) ? seoLang : langs[0] ?? data.site.default_language;
    setSeoLang(selectedLang);
    setSeoTitleDraft(seoData[selectedLang]?.title ?? '');
    setSeoDescriptionDraft(seoData[selectedLang]?.description ?? '');
  }, [data]);

  const selectedPage = useMemo(() => data?.pages.find((page) => page.id === selectedPageId) ?? null, [data, selectedPageId]);
  const selectedBlocks = useMemo(() => (data?.blocks ?? []).filter((block) => block.page_id === selectedPageId).sort((a, b) => a.order_index - b.order_index), [data, selectedPageId]);

  const requireData = () => {
    if (!data || !sessionUserId) throw new Error('CMS data is not loaded');
    return { data, actor: sessionUserId };
  };

  const updateBlock = async (block: BlockRow, patch: Partial<BlockRow>, action = 'update') => {
    const ctx = requireData();
    const payload = {
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.order_index !== undefined ? { order_index: patch.order_index } : {}),
      ...(patch.hidden !== undefined ? { hidden: patch.hidden } : {}),
      ...(patch.settings !== undefined ? { settings: patch.settings } : {}),
      ...(patch.content !== undefined ? { content: patch.content } : {}),
      updated_at: new Date().toISOString(),
      updated_by: ctx.actor,
    };
    const { error } = await supabase.from('blocks').update(payload).eq('id', block.id);
    if (error) throw error;
    await insertAuditLog({ siteId: ctx.data.site.id, entityType: 'block', entityId: String(block.id), action, actor: ctx.actor, beforeData: block as unknown as Json, afterData: payload as unknown as Json });
  };

  const reorderBlocks = async (blocks: BlockRow[]) => {
    const ctx = requireData();
    const timestamp = new Date().toISOString();
    const payload = blocks.map((block, index) => ({ id: block.id, order_index: index, updated_at: timestamp, updated_by: ctx.actor }));
    await Promise.all(
      payload.map(async (entry) => {
        const { error } = await supabase
          .from('blocks')
          .update({
            order_index: entry.order_index,
            updated_at: entry.updated_at,
            updated_by: entry.updated_by,
          })
          .eq('id', entry.id);
        if (error) throw error;
      }),
    );
    await insertAuditLog({ siteId: ctx.data.site.id, entityType: 'blocks', entityId: String(selectedPageId ?? 0), action: 'reorder', actor: ctx.actor, afterData: payload as unknown as Json });
  };

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  if (!sessionUserId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <form onSubmit={submitLogin} className="w-full max-w-sm rounded-lg border border-border bg-card p-6 space-y-4">
          <h1 className="text-2xl font-heading font-bold">CMS Login</h1>
          <p className="text-sm text-muted-foreground">Use Supabase Auth credentials.</p>
          <div><label className="text-sm">Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full mt-1 rounded border border-input bg-background px-3 py-2" /></div>
          <div><label className="text-sm">Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full mt-1 rounded border border-input bg-background px-3 py-2" /></div>
          {authError ? <p className="text-sm text-destructive">{authError}</p> : null}
          <button type="submit" className="w-full rounded bg-accent px-3 py-2 text-accent-foreground">Sign in</button>
        </form>
      </main>
    );
  }

  if (cmsQuery.isLoading) return <main className="min-h-screen flex items-center justify-center text-muted-foreground">Loading CMS...</main>;
  if (cmsQuery.isError || !data) return <main className="min-h-screen flex items-center justify-center text-destructive">Failed to load CMS.</main>;

  const canEdit = data.canEdit;
  const canManageUsers = data.canManageUsers;
  const isSuperOrAdmin = data.role === 'Superadmin' || data.role === 'Admin';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-2 items-center justify-between">
          <div>
            <h1 className="text-xl font-heading font-bold">ClearContent CMS</h1>
            <p className="text-xs text-muted-foreground">Team: {teamSlug} | Role: {data.role || 'No access'}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.open('/?preview=true', '_blank', 'noopener,noreferrer')} className="rounded border border-input px-3 py-1.5 text-sm hover:bg-muted">Preview Mode</button>
            <button onClick={() => cmsQuery.refetch()} className="rounded border border-input px-3 py-1.5 text-sm hover:bg-muted">Refresh</button>
            <button onClick={() => supabase.auth.signOut()} className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        <aside className="rounded border border-border bg-card p-2 h-fit">
          {views.map((item) => <button key={item.key} onClick={() => setView(item.key)} className={`w-full text-left rounded px-3 py-2 text-sm ${view === item.key ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}>{item.label}</button>)}
        </aside>

        <main className="rounded border border-border bg-card p-4 md:p-6 space-y-4">
          {view === 'pages' ? <table className="w-full text-sm"><thead><tr className="border-b border-border"><th className="py-2 text-left">Slug</th><th className="py-2 text-left">Updated</th><th className="py-2 text-left">Updated By</th></tr></thead><tbody>{data.pages.map((page) => <tr key={page.id} className="border-b border-border/60"><td className="py-2">{page.slug}</td><td className="py-2">{new Date(page.updated_at).toLocaleString()}</td><td className="py-2 text-muted-foreground">{page.updated_by ?? '-'}</td></tr>)}</tbody></table> : null}

          {view === 'blocks' ? (
            <>
              <div className="flex flex-wrap gap-2 items-center">
                <select value={selectedPageId ?? ''} onChange={(e) => setSelectedPageId(Number(e.target.value))} className="rounded border border-input bg-background px-2 py-1.5 text-sm">{data.pages.map((page) => <option key={page.id} value={page.id}>{page.slug}</option>)}</select>
                <button disabled={!canEdit || !selectedPage} onClick={async () => {
                  if (!selectedPage) return;
                  const ctx = requireData();
                  const { data: inserted, error } = await supabase.from('blocks').insert({ page_id: selectedPage.id, type: 'text', order_index: selectedBlocks.length, hidden: false, settings: { spacing: 'large', alignment: 'left', bgType: 'solid', bgValue: 'White', typography: 'body-lg' }, content: { en: { title: 'New block', body: '' } }, updated_by: ctx.actor }).select('*').single();
                  if (error) throw error;
                  await insertAuditLog({ siteId: ctx.data.site.id, entityType: 'block', entityId: String(inserted.id), action: 'create', actor: ctx.actor, afterData: inserted as unknown as Json });
                  await cmsQuery.refetch();
                }} className="rounded bg-accent px-3 py-1.5 text-sm text-accent-foreground disabled:opacity-50">Add Block</button>
              </div>

              {selectedBlocks.map((block, index) => <div key={block.id} className={`rounded border border-border p-3 space-y-2 ${block.hidden ? 'opacity-60' : ''}`}>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-medium">{block.type}</span><span className="text-xs text-muted-foreground">#{block.order_index}</span><span className="text-xs text-muted-foreground">{new Date(block.updated_at).toLocaleString()}</span><span className="text-xs text-muted-foreground">{block.updated_by ?? '-'}</span>
                  <div className="ml-auto flex gap-1">
                    <button disabled={!canEdit || index === 0} onClick={async () => { const next = [...selectedBlocks]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; await reorderBlocks(next); await cmsQuery.refetch(); }} className="rounded border border-input px-2 py-1 text-xs disabled:opacity-50">Up</button>
                    <button disabled={!canEdit || index === selectedBlocks.length - 1} onClick={async () => { const next = [...selectedBlocks]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; await reorderBlocks(next); await cmsQuery.refetch(); }} className="rounded border border-input px-2 py-1 text-xs disabled:opacity-50">Down</button>
                    <button disabled={!canEdit} onClick={async () => { await updateBlock(block, { hidden: !block.hidden }, 'toggle_visibility'); await cmsQuery.refetch(); }} className="rounded border border-input px-2 py-1 text-xs disabled:opacity-50">{block.hidden ? 'Unhide' : 'Hide'}</button>
                    <button disabled={!canEdit} onClick={async () => {
                      const ctx = requireData();
                      const { data: inserted, error } = await supabase.from('blocks').insert({ page_id: block.page_id, type: block.type, order_index: block.order_index + 1, hidden: block.hidden, settings: block.settings, content: block.content, updated_by: ctx.actor }).select('*').single();
                      if (error) throw error;
                      await insertAuditLog({ siteId: ctx.data.site.id, entityType: 'block', entityId: String(inserted.id), action: 'duplicate', actor: ctx.actor, afterData: inserted as unknown as Json });
                      const renumbered = [...selectedBlocks, inserted].sort((a, b) => a.order_index - b.order_index).map((entry, i) => ({ ...entry, order_index: i }));
                      await reorderBlocks(renumbered);
                      await cmsQuery.refetch();
                    }} className="rounded border border-input px-2 py-1 text-xs disabled:opacity-50">Duplicate</button>
                    <button disabled={!canEdit} onClick={async () => { const ctx = requireData(); const { error } = await supabase.from('blocks').delete().eq('id', block.id); if (error) throw error; await insertAuditLog({ siteId: ctx.data.site.id, entityType: 'block', entityId: String(block.id), action: 'delete', actor: ctx.actor, beforeData: block as unknown as Json }); await cmsQuery.refetch(); }} className="rounded border border-destructive px-2 py-1 text-xs text-destructive disabled:opacity-50">Delete</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{(['spacing', 'alignment', 'bgType', 'typography'] as const).map((field) => <input key={field} disabled={!canEdit} defaultValue={((block.settings as Record<string, string>) ?? {})[field] ?? ''} onBlur={async (e) => { const nextSettings = { ...(block.settings as Record<string, string>), [field]: e.target.value }; await updateBlock(block, { settings: nextSettings as unknown as Json }); await cmsQuery.refetch(); }} className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs" />)}</div>
                <textarea disabled={!canEdit} defaultValue={JSON.stringify(block.content ?? {}, null, 2)} onBlur={async (e) => { const parsed = parseJsonObject(e.target.value); await updateBlock(block, { content: parsed as unknown as Json }); await cmsQuery.refetch(); }} className="w-full h-40 rounded border border-input bg-background p-2 font-mono text-xs" />
              </div>)}
            </>
          ) : null}

          {view === 'menu' ? <><textarea value={menuDraft} onChange={(e) => setMenuDraft(e.target.value)} className="w-full h-64 rounded border border-input bg-background p-3 font-mono text-sm" /><button disabled={!canEdit} onClick={async () => { const ctx = requireData(); const payload = { site_id: data.site.id, items: parseJsonObject(menuDraft), updated_at: new Date().toISOString(), updated_by: ctx.actor }; const { error } = await supabase.from('menus').upsert(payload, { onConflict: 'site_id' }); if (error) throw error; await insertAuditLog({ siteId: data.site.id, entityType: 'menu', entityId: String(data.menu?.id ?? data.site.id), action: 'update', actor: ctx.actor, beforeData: data.menu as unknown as Json, afterData: payload as unknown as Json }); await cmsQuery.refetch(); }} className="rounded bg-accent px-3 py-2 text-sm text-accent-foreground disabled:opacity-50">Save Menu</button></> : null}

          {view === 'forms' ? <><textarea value={formDraft} onChange={(e) => setFormDraft(e.target.value)} className="w-full h-72 rounded border border-input bg-background p-3 font-mono text-sm" /><button disabled={!canEdit} onClick={async () => { const ctx = requireData(); const payload = { site_id: data.site.id, key: 'contact', schema: parseJsonObject(formDraft), updated_at: new Date().toISOString(), updated_by: ctx.actor }; const { error } = await supabase.from('forms').upsert(payload, { onConflict: 'site_id,key' }); if (error) throw error; await insertAuditLog({ siteId: data.site.id, entityType: 'form', entityId: String(data.form?.id ?? data.site.id), action: 'update', actor: ctx.actor, beforeData: data.form as unknown as Json, afterData: payload as unknown as Json }); await cmsQuery.refetch(); }} className="rounded bg-accent px-3 py-2 text-sm text-accent-foreground disabled:opacity-50">Save Form</button></> : null}

          {view === 'seo' ? <><div className="flex gap-2">{enabledLanguagesDraft.map((lang) => <button key={lang} onClick={() => { const seoData = (data.seo?.data as Record<string, Record<string, string>>) ?? {}; setSeoLang(lang); setSeoTitleDraft(seoData[lang]?.title ?? ''); setSeoDescriptionDraft(seoData[lang]?.description ?? ''); }} className={`rounded px-3 py-1.5 text-sm ${seoLang === lang ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}>{lang.toUpperCase()}</button>)}</div><input value={seoTitleDraft} onChange={(e) => setSeoTitleDraft(e.target.value)} className="w-full rounded border border-input bg-background px-3 py-2" /><textarea value={seoDescriptionDraft} onChange={(e) => setSeoDescriptionDraft(e.target.value)} className="w-full h-28 rounded border border-input bg-background px-3 py-2" /><button disabled={!canEdit} onClick={async () => { const ctx = requireData(); const nextData = { ...((data.seo?.data as Record<string, Record<string, string>>) ?? {}), [seoLang]: { title: seoTitleDraft, description: seoDescriptionDraft } }; const payload = { site_id: data.site.id, slug: 'home', data: nextData, updated_at: new Date().toISOString(), updated_by: ctx.actor }; const { error } = await supabase.from('seo').upsert(payload, { onConflict: 'site_id,slug' }); if (error) throw error; await insertAuditLog({ siteId: data.site.id, entityType: 'seo', entityId: String(data.seo?.id ?? data.site.id), action: 'update', actor: ctx.actor, beforeData: data.seo as unknown as Json, afterData: payload as unknown as Json }); await cmsQuery.refetch(); }} className="rounded bg-accent px-3 py-2 text-sm text-accent-foreground disabled:opacity-50">Save SEO</button></> : null}

          {view === 'languages' ? <><div className="flex gap-2">{['en', 'et'].map((lang) => <label key={lang} className="inline-flex items-center gap-2 rounded border border-input px-3 py-2 text-sm"><input type="checkbox" checked={enabledLanguagesDraft.includes(lang)} onChange={(e) => { if (e.target.checked) setEnabledLanguagesDraft(Array.from(new Set([...enabledLanguagesDraft, lang]))); else { const next = enabledLanguagesDraft.filter((entry) => entry !== lang); setEnabledLanguagesDraft(next.length > 0 ? next : [defaultLanguageDraft]); } }} />{lang.toUpperCase()}</label>)}</div><div><label className="text-sm">Default</label><select value={defaultLanguageDraft} onChange={(e) => setDefaultLanguageDraft(e.target.value)} className="ml-2 rounded border border-input bg-background px-2 py-1.5">{enabledLanguagesDraft.map((lang) => <option key={lang} value={lang}>{lang.toUpperCase()}</option>)}</select></div><button disabled={!isSuperOrAdmin} onClick={async () => { const ctx = requireData(); const payload = { default_language: defaultLanguageDraft, enabled_languages: enabledLanguagesDraft, updated_at: new Date().toISOString() }; const { error } = await supabase.from('sites').update(payload).eq('id', data.site.id); if (error) throw error; await insertAuditLog({ siteId: data.site.id, entityType: 'site', entityId: String(data.site.id), action: 'update_languages', actor: ctx.actor, beforeData: data.site as unknown as Json, afterData: payload as unknown as Json }); await cmsQuery.refetch(); }} className="rounded bg-accent px-3 py-2 text-sm text-accent-foreground disabled:opacity-50">Save Languages</button></> : null}

          {view === 'users' ? (canManageUsers ? <><table className="w-full text-sm"><thead><tr className="border-b border-border"><th className="py-2 text-left">User ID</th><th className="py-2 text-left">Role</th><th className="py-2 text-left">Actions</th></tr></thead><tbody>{data.userRoles.map((item) => <tr key={item.id} className="border-b border-border/60"><td className="py-2 font-mono text-xs">{item.user_id}</td><td className="py-2">{item.role}</td><td className="py-2"><button onClick={async () => { const ctx = requireData(); const { error } = await supabase.from('user_roles').delete().eq('id', item.id); if (error) throw error; await insertAuditLog({ siteId: data.site.id, entityType: 'user_roles', entityId: String(item.id), action: 'delete', actor: ctx.actor, beforeData: item as unknown as Json }); await cmsQuery.refetch(); }} className="rounded border border-destructive px-2 py-1 text-xs text-destructive">Remove</button></td></tr>)}</tbody></table><div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2 items-end"><input value={userIdDraft} onChange={(e) => setUserIdDraft(e.target.value)} placeholder="User UUID" className="rounded border border-input bg-background px-3 py-2" /><select value={userRoleDraft} onChange={(e) => setUserRoleDraft(e.target.value as 'Admin' | 'Editor')} className="rounded border border-input bg-background px-3 py-2"><option value="Admin">Admin</option><option value="Editor">Editor</option></select><button onClick={async () => { const ctx = requireData(); const payload = { user_id: userIdDraft, site_id: data.site.id, role: userRoleDraft }; const { error } = await supabase.from('user_roles').upsert(payload, { onConflict: 'user_id,site_id' }); if (error) throw error; await insertAuditLog({ siteId: data.site.id, entityType: 'user_roles', entityId: userIdDraft, action: 'upsert', actor: ctx.actor, afterData: payload as unknown as Json }); setUserIdDraft(''); await cmsQuery.refetch(); }} className="rounded bg-accent px-3 py-2 text-sm text-accent-foreground">Save Role</button></div></> : <p className="text-muted-foreground">Only Superadmin/Admin can manage roles.</p>) : null}

          {view === 'inquiries' ? <div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border"><th className="py-2 text-left">ID</th><th className="py-2 text-left">Date</th><th className="py-2 text-left">Payload</th></tr></thead><tbody>{data.inquiries.map((inquiry) => <tr key={inquiry.id} className="border-b border-border/60 align-top"><td className="py-2 font-mono text-xs">{inquiry.id}</td><td className="py-2">{new Date(inquiry.created_at).toLocaleString()}</td><td className="py-2"><pre className="whitespace-pre-wrap text-xs">{JSON.stringify(inquiry.data, null, 2)}</pre></td></tr>)}</tbody></table></div> : null}
        </main>
      </div>
    </div>
  );
};

export default CmsPanel;


