import { supabase } from '@/lib/supabase';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
export type Role = 'Superadmin' | 'Admin' | 'Editor' | '';

export interface TeamRow {
  id: number;
  team_slug: string;
}

export interface SiteRow {
  id: number;
  team_id: number;
  default_language: string;
  enabled_languages: Json;
  created_at: string;
  updated_at: string;
}

export interface PageRow {
  id: number;
  site_id: number;
  slug: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface BlockRow {
  id: number;
  page_id: number;
  type: string;
  order_index: number;
  hidden: boolean;
  settings: Json;
  content: Json;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface MenuRow {
  id: number;
  site_id: number;
  items: Json;
  updated_at: string;
  updated_by: string | null;
}

export interface FormRow {
  id: number;
  site_id: number;
  key: string;
  schema: Json;
  updated_at: string;
  updated_by: string | null;
}

export interface SeoRow {
  id: number;
  site_id: number;
  slug: string;
  data: Json;
  updated_at: string;
  updated_by: string | null;
}

export interface InquiryRow {
  id: string;
  site_id: number;
  team_slug: string;
  source: string;
  data: Json;
  created_at: string;
}

export interface UserRoleRow {
  id: number;
  user_id: string;
  site_id: number;
  role: 'Superadmin' | 'Admin' | 'Editor';
}

export const normalizeLanguageList = (value: Json, fallback = 'en') => {
  if (!Array.isArray(value)) return [fallback];
  const langs = value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  return langs.length > 0 ? langs : [fallback];
};

export const getLocalizedField = <T = string>(source: Json, lang: string, fallback: string): T | null => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
  const keyed = source as Record<string, unknown>;
  const localized = keyed[lang] ?? keyed[fallback];
  return (localized as T) ?? null;
};

export const parseJsonObject = (value: string) => JSON.parse(value) as Record<string, unknown>;

export const loadSiteByTeamSlug = async (teamSlug: string) => {
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, team_slug')
    .eq('team_slug', teamSlug)
    .maybeSingle();
  if (teamError) throw teamError;
  if (!team) throw new Error(`Team not found for slug: ${teamSlug}`);
  const teamRow = team as TeamRow;

  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('*')
    .eq('team_id', teamRow.id)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (siteError) throw siteError;
  if (!site) throw new Error(`No site found for team: ${teamSlug}`);
  return { team: teamRow, site: site as SiteRow };
};

export const loadPublicSiteData = async (teamSlug: string) => {
  const { team, site } = await loadSiteByTeamSlug(teamSlug);
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('*')
    .eq('site_id', site.id)
    .eq('slug', 'home')
    .maybeSingle();
  if (pageError) throw pageError;
  if (!page) throw new Error('Home page not found');
  const pageRow = page as PageRow;

  const [blocksResponse, menuResponse, formResponse, seoResponse] = await Promise.all([
    supabase.from('blocks').select('*').eq('page_id', pageRow.id).order('order_index', { ascending: true }),
    supabase.from('menus').select('*').eq('site_id', site.id).maybeSingle(),
    supabase.from('forms').select('*').eq('site_id', site.id).eq('key', 'contact').maybeSingle(),
    supabase.from('seo').select('*').eq('site_id', site.id).eq('slug', 'home').maybeSingle(),
  ]);

  if (blocksResponse.error) throw blocksResponse.error;
  if (menuResponse.error) throw menuResponse.error;
  if (formResponse.error) throw formResponse.error;
  if (seoResponse.error) throw seoResponse.error;

  return {
    team,
    site,
    page: pageRow,
    blocks: (blocksResponse.data as BlockRow[]) ?? [],
    menu: menuResponse.data ?? null,
    form: formResponse.data ?? null,
    seo: seoResponse.data ?? null,
  };
};

export const getCurrentUserRole = async (userId: string, siteId: number) => {
  const [superadminResult, roleResult] = await Promise.all([
    supabase.rpc('is_superadmin', { p_user_id: userId }),
    supabase.rpc('get_user_role', { p_user_id: userId, p_site_id: siteId }),
  ]);
  if (superadminResult.error) throw superadminResult.error;
  if (roleResult.error) throw roleResult.error;
  const isSuperadmin = !!superadminResult.data;
  const role = (roleResult.data ?? '') as Role;
  return {
    isSuperadmin,
    role: isSuperadmin ? 'Superadmin' : role,
  };
};

export const insertAuditLog = async (input: {
  siteId: number;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  beforeData?: Json | null;
  afterData?: Json | null;
}) => {
  const { error } = await supabase.from('audit_log').insert({
    site_id: input.siteId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    before_data: input.beforeData ?? null,
    after_data: input.afterData ?? null,
    actor: input.actor,
  });
  if (error) throw error;
};
