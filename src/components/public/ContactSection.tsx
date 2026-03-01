import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { z } from 'zod';

const ContactSection = () => {
  const { content } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const schema = z.object({
    company: z.string().trim().min(1, 'Required').max(200),
    person: z.string().trim().min(1, 'Required').max(200),
    email: z.string().trim().email('Invalid email').max(255),
    message: z.string().trim().min(1, 'Required').max(2000),
    consent: z.literal(true, { errorMap: () => ({ message: 'Required' }) }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      company: fd.get('company') as string,
      person: fd.get('person') as string,
      email: fd.get('email') as string,
      message: fd.get('message') as string,
      consent: fd.get('consent') === 'on' ? true as const : false as const,
    };
    const result = schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitted(true);
  };

  const inputClass = "w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors";

  return (
    <section id="contact" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            {content.contact.title}
          </h2>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            {content.contact.intro}
          </p>

          {submitted ? (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-8 text-center">
              <p className="text-lg font-medium text-foreground">{content.contact.success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-foreground mb-1.5">{content.contact.fields.company}</label>
                <input id="company" name="company" type="text" className={inputClass} required />
                {errors.company && <p className="text-destructive text-sm mt-1">{errors.company}</p>}
              </div>
              <div>
                <label htmlFor="person" className="block text-sm font-medium text-foreground mb-1.5">{content.contact.fields.person}</label>
                <input id="person" name="person" type="text" className={inputClass} required />
                {errors.person && <p className="text-destructive text-sm mt-1">{errors.person}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">{content.contact.fields.email}</label>
                <input id="email" name="email" type="email" className={inputClass} required />
                {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1.5">{content.contact.fields.message}</label>
                <textarea id="message" name="message" rows={5} className={inputClass} required />
                {errors.message && <p className="text-destructive text-sm mt-1">{errors.message}</p>}
              </div>
              <div className="flex items-start gap-3">
                <input id="consent" name="consent" type="checkbox" className="mt-1 h-4 w-4 rounded border-input text-accent focus:ring-ring" required />
                <label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed">{content.contact.fields.consent}</label>
              </div>
              {errors.consent && <p className="text-destructive text-sm">{errors.consent}</p>}
              <button type="submit" className="gradient-accent px-8 py-3 rounded-lg text-accent-foreground font-semibold hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                {content.contact.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
