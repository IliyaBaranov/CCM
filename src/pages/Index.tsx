import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { envConfig, supabase } from '@/lib/supabase';
import { BlockRow, Json, loadPublicSiteData, normalizeLanguageList } from '@/lib/cms-data';

const spacingClass: Record<string, string> = {
  small: 'py-10 md:py-14',
  medium: 'py-14 md:py-20',
  large: 'py-20 md:py-28',
};

const alignmentClass: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const typographyClass: Record<string, string> = {
  'heading-xl': 'text-4xl md:text-5xl lg:text-6xl font-heading font-bold',
  'heading-lg': 'text-3xl md:text-4xl font-heading font-bold',
  'body-lg': 'text-lg md:text-xl',
  'body-md': 'text-base md:text-lg',
};

const bgClass = (type?: string, value?: string) => {
  if (type === 'gradient') return 'gradient-hero text-primary-foreground';
  if (value?.toLowerCase() === 'muted') return 'bg-muted';
  return 'bg-background';
};

const getLocalizedText = (value: Json, lang: string, fallback: string) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const obj = value as Record<string, unknown>;
  const localized = (obj[lang] ?? obj[fallback] ?? {}) as Record<string, unknown>;
  return localized;
};

const setHeadMeta = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const ContactForm = ({
  lang,
  fallbackLang,
  siteId,
  teamSlug,
  block,
  schema,
}: {
  lang: string;
  fallbackLang: string;
  siteId: number;
  teamSlug: string;
  block: BlockRow;
  schema: Record<string, unknown>;
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const localizedBlock = getLocalizedText(block.content, lang, fallbackLang) as Record<string, unknown>;

  const fields = (schema.fields as Array<Record<string, unknown>>) ?? [];
  const submitLabelObj = (schema.submitLabel as Record<string, string>) ?? {};
  const submitLabel = submitLabelObj[lang] ?? submitLabelObj[fallbackLang] ?? 'Send Request';
  const successMessage = 'Thank you for your message. We will contact you shortly.';

  const baseShape: Record<string, z.ZodTypeAny> = {};
  fields.forEach((field) => {
    const fieldId = String(field.id ?? '').trim();
    const required = !!field.required;
    const type = String(field.type ?? 'text');
    if (!fieldId) return;
    if (type === 'checkbox') {
      baseShape[fieldId] = required ? z.literal(true, { errorMap: () => ({ message: 'Required' }) }) : z.boolean();
      return;
    }
    if (type === 'email') {
      baseShape[fieldId] = required ? z.string().trim().email('Invalid email').min(1, 'Required') : z.string().trim().email('Invalid email').optional();
      return;
    }
    baseShape[fieldId] = required ? z.string().trim().min(1, 'Required') : z.string().trim().optional();
  });
  const schemaValidator = z.object(baseShape);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = fields.reduce<Record<string, unknown>>((acc, field) => {
      const fieldId = String(field.id ?? '').trim();
      const type = String(field.type ?? 'text');
      if (!fieldId) return acc;
      if (type === 'checkbox') {
        acc[fieldId] = formData.get(fieldId) === 'on';
      } else {
        acc[fieldId] = String(formData.get(fieldId) ?? '');
      }
      return acc;
    }, {});

    const parsed = schemaValidator.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        nextErrors[String(issue.path[0] ?? '')] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      let inquiryId = '';
      const { data, error } = await supabase
        .from('inquiries')
        .insert({
          site_id: siteId,
          team_slug: teamSlug,
          source: 'ai-web-2026',
          data: parsed.data,
        })
        .select('id')
        .single();
      if (error) throw error;
      inquiryId = String(data.id);

      const emailResponse = await fetch('/.netlify/functions/send-inquiry-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId,
          teamSlug,
          toEmail: null,
          fields: parsed.data,
        }),
      });
      if (!emailResponse.ok) {
        throw new Error(`inquiry_saved_email_failed:${inquiryId}`);
      }
      setSubmitted(true);
    } catch (submitError) {
      const fallback = 'Failed to submit inquiry';
      const message = submitError instanceof Error ? submitError.message : fallback;
      if (message.startsWith('inquiry_saved_email_failed:')) {
        setErrors({ form: 'Your inquiry was saved successfully, but we could not send a notification email right now. Our team can still review your submission.' });
        return;
      }
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors';

  if (submitted) {
    return (
      <div className="bg-accent/10 border border-accent/30 rounded-lg p-8 text-center">
        <p className="text-lg font-medium text-foreground">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {fields.map((field) => {
        const fieldId = String(field.id ?? '');
        const type = String(field.type ?? 'text');
        const required = !!field.required;
        const labels = (field.label as Record<string, string>) ?? {};
        const label = labels[lang] ?? labels[fallbackLang] ?? fieldId;
        if (type === 'textarea') {
          return (
            <div key={fieldId}>
              <label htmlFor={fieldId} className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
              <textarea id={fieldId} name={fieldId} rows={5} required={required} className={inputClass} />
              {errors[fieldId] ? <p className="text-destructive text-sm mt-1">{errors[fieldId]}</p> : null}
            </div>
          );
        }
        if (type === 'checkbox') {
          return (
            <div key={fieldId}>
              <div className="flex items-start gap-3">
                <input id={fieldId} name={fieldId} type="checkbox" className="mt-1 h-4 w-4 rounded border-input text-accent focus:ring-ring" required={required} />
                <label htmlFor={fieldId} className="text-sm text-muted-foreground leading-relaxed">{label}</label>
              </div>
              {errors[fieldId] ? <p className="text-destructive text-sm mt-1">{errors[fieldId]}</p> : null}
            </div>
          );
        }
        return (
          <div key={fieldId}>
            <label htmlFor={fieldId} className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
            <input id={fieldId} name={fieldId} type={type} required={required} className={inputClass} />
            {errors[fieldId] ? <p className="text-destructive text-sm mt-1">{errors[fieldId]}</p> : null}
          </div>
        );
      })}
      {errors.form ? <p className="text-destructive text-sm">{errors.form}</p> : null}
      <button disabled={submitting} type="submit" className="gradient-accent px-8 py-3 rounded-lg text-accent-foreground font-semibold hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50">
        {submitting ? 'Submitting...' : submitLabel}
      </button>
      <p className="sr-only">{localizedBlock.success as string}</p>
    </form>
  );
};

const Index = () => {
  const teamSlug = envConfig.teamSlug;
  const studentName = envConfig.studentName;
  const [lang, setLang] = useState('en');
  const previewMode = useMemo(() => new URLSearchParams(window.location.search).get('preview') === 'true', []);

  const siteQuery = useQuery({
    queryKey: ['public-site', teamSlug],
    queryFn: () => loadPublicSiteData(teamSlug),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 20,
  });

  const data = siteQuery.data;
  const enabledLanguages = normalizeLanguageList(data?.site.enabled_languages ?? ['en'], data?.site.default_language ?? 'en');
  const fallbackLang = data?.site.default_language ?? 'en';
  const safeLang = enabledLanguages.includes(lang) ? lang : fallbackLang;

  useEffect(() => {
    if (!data) return;
    if (!enabledLanguages.includes(lang)) {
      setLang(fallbackLang);
    }
  }, [data, enabledLanguages, fallbackLang, lang]);

  useEffect(() => {
    if (!data) return;
    const seoData = (data.seo?.data as Record<string, Record<string, string>>) ?? {};
    const localizedSeo = seoData[safeLang] ?? seoData[fallbackLang] ?? {};
    const title = localizedSeo.title ?? 'ClearContent CMS';
    const description = localizedSeo.description ?? '';
    document.title = title;
    setHeadMeta('description', description);
    setHeadMeta('mainor-assignment', 'ai-web-2026');
    setHeadMeta('team-slug', teamSlug);
  }, [data, safeLang, fallbackLang, teamSlug]);

  if (siteQuery.isLoading) {
    return <main className="min-h-screen flex items-center justify-center text-muted-foreground">Loading content...</main>;
  }

  if (siteQuery.isError || !data) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-destructive">Could not load CMS content from Supabase.</p>
        <p className="text-sm text-muted-foreground">{siteQuery.error instanceof Error ? siteQuery.error.message : 'Unknown error'}</p>
        <button onClick={() => siteQuery.refetch()} className="px-4 py-2 rounded bg-accent text-accent-foreground">Retry</button>
      </main>
    );
  }

  const menuItems = Array.isArray(data.menu?.items) ? (data.menu?.items as Array<Record<string, unknown>>) : [];
  const blocks = data.blocks.filter((block) => !block.hidden);
  const formSchema = (data.form?.schema as Record<string, unknown>) ?? {};
  const watermark = `Built in AI Web Session 2026, ClearContent CMS, Student: ${studentName}, Team: ${teamSlug}`;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="font-heading text-xl font-bold text-primary tracking-tight">GasTrade Pro</a>
          <nav className="hidden md:flex items-center gap-8">
            {menuItems
              .filter((item) => item.enabled !== false)
              .map((item) => {
                const labels = (item.label as Record<string, string>) ?? {};
                const label = labels[safeLang] ?? labels[fallbackLang] ?? 'Item';
                const anchor = String(item.anchor ?? '#');
                return (
                  <a key={String(item.id ?? anchor)} href={anchor} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </a>
                );
              })}
          </nav>
          <div className="flex items-center gap-3">
            <select
              value={safeLang}
              onChange={(e) => setLang(e.target.value)}
              className="border border-input rounded px-2 py-1.5 text-sm bg-card text-foreground"
            >
              {enabledLanguages.map((language) => (
                <option key={language} value={language}>{language.toUpperCase()}</option>
              ))}
            </select>
            <button onClick={() => siteQuery.refetch()} className="text-sm px-3 py-1.5 rounded border border-input hover:bg-muted">
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {previewMode ? (
          <div className="bg-accent text-accent-foreground text-center py-2 text-sm font-medium">Preview mode is enabled</div>
        ) : null}

        {blocks.map((block) => {
          const settings = (block.settings as Record<string, string>) ?? {};
          const localized = getLocalizedText(block.content, safeLang, fallbackLang) as Record<string, unknown>;
          const sectionId = block.type === 'text' ? 'about' : block.type === 'list' ? 'offers' : block.type === 'form' ? 'contact' : undefined;
          return (
            <section
              key={block.id}
              id={sectionId}
              className={`${spacingClass[settings.spacing] ?? spacingClass.large} ${bgClass(settings.bgType, settings.bgValue)}`}
            >
              <div className={`container mx-auto px-4 ${alignmentClass[settings.alignment] ?? alignmentClass.left}`}>
                {block.type === 'hero' ? (
                  <div className="max-w-3xl">
                    <h1 className={`${typographyClass[settings.typography] ?? typographyClass['heading-xl']} leading-tight mb-6`}>
                      {String(localized.title ?? '')}
                    </h1>
                    <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl leading-relaxed">
                      {String(localized.subtitle ?? '')}
                    </p>
                    <a href="#contact" className="gradient-accent inline-block px-8 py-4 rounded-lg text-accent-foreground font-semibold text-lg hover:opacity-90 transition-opacity">
                      {String(localized.cta ?? 'Contact')}
                    </a>
                  </div>
                ) : null}

                {block.type === 'text' ? (
                  <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-8">{String(localized.title ?? '')}</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">{String(localized.body ?? '')}</p>
                  </div>
                ) : null}

                {block.type === 'list' ? (
                  <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-10">{String(localized.title ?? '')}</h2>
                    <ul className="space-y-5">
                      {Array.isArray(localized.items) ? localized.items.map((item, idx) => (
                        <li key={`${block.id}-${idx}`} className="text-foreground text-lg leading-relaxed">• {String(item)}</li>
                      )) : null}
                    </ul>
                  </div>
                ) : null}

                {block.type === 'form' ? (
                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">{String(localized.title ?? '')}</h2>
                    <p className="text-muted-foreground text-lg mb-10 leading-relaxed">{String(localized.intro ?? '')}</p>
                    <ContactForm
                      lang={safeLang}
                      fallbackLang={fallbackLang}
                      siteId={data.site.id}
                      teamSlug={teamSlug}
                      block={block}
                      schema={formSchema}
                    />
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="bg-primary py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary-foreground/70 text-sm">{watermark}</p>
        </div>
      </footer>
    </>
  );
};

export default Index;
