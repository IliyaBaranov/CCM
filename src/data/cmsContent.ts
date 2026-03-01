export type Language = 'en' | 'et';

export interface CmsContent {
  seo: {
    title: string;
    description: string;
  };
  nav: {
    about: string;
    offers: string;
    contact: string;
    languageLabel: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  about: {
    title: string;
    body: string;
  };
  offers: {
    title: string;
    items: string[];
  };
  contact: {
    title: string;
    intro: string;
    fields: {
      company: string;
      person: string;
      email: string;
      message: string;
      consent: string;
    };
    submit: string;
    success: string;
  };
  footer: {
    copyright: string;
  };
}

export const cmsData: Record<Language, CmsContent> = {
  en: {
    seo: {
      title: 'GasTrade Pro — Reliable Refrigerant Gas Trading Partner',
      description: 'We supply high-quality refrigerant gases for HVAC, refrigeration, and industrial applications across international markets.',
    },
    nav: {
      about: 'About Us',
      offers: 'What We Offer',
      contact: 'Contact',
      languageLabel: 'Language',
    },
    hero: {
      title: 'Reliable Refrigerant Gas Trading Partner',
      subtitle: 'We supply high-quality refrigerant gases for HVAC, refrigeration, and industrial applications, working with partners across international markets.',
      cta: 'Contact Us',
    },
    about: {
      title: 'About Us',
      body: 'GasTrade Pro is a trusted B2B refrigerant gas trading company with over 15 years of experience in global markets. We connect manufacturers with distributors, ensuring reliable supply chains and competitive pricing. Our team of industry experts works closely with clients to provide tailored solutions for their specific needs, from standard refrigerants to specialty gases. We are committed to environmental compliance and sustainable practices in every transaction.',
    },
    offers: {
      title: 'What We Offer',
      items: [
        'Full range of HFC, HFO, and natural refrigerants (R-134a, R-410A, R-32, R-290, R-744, and more)',
        'Bulk and cylinder supply with flexible logistics',
        'Competitive pricing with transparent terms',
        'Regulatory compliance support and documentation',
        'Custom blending and repackaging services',
        'Dedicated account management and technical consulting',
      ],
    },
    contact: {
      title: 'Contact Us',
      intro: 'Have a question or ready to start a partnership? Fill out the form below and our team will get back to you within 24 hours.',
      fields: {
        company: 'Company Name',
        person: 'Contact Person',
        email: 'Email Address',
        message: 'Your Message',
        consent: 'I agree to the processing of my personal data in accordance with the privacy policy.',
      },
      submit: 'Send Request',
      success: 'Thank you for your message. We will contact you shortly.',
    },
    footer: {
      copyright: '© 2026 GasTrade Pro. All rights reserved.',
    },
  },
  et: {
    seo: {
      title: 'GasTrade Pro — Usaldusväärne külmagaasi kaubanduspartner',
      description: 'Tarnime kvaliteetseid külmagaase HVAC, külmutus- ja tööstusrakendustele rahvusvahelistel turgudel.',
    },
    nav: {
      about: 'Meist',
      offers: 'Mida pakume',
      contact: 'Kontakt',
      languageLabel: 'Keel',
    },
    hero: {
      title: 'Usaldusväärne külmagaasi kaubanduspartner',
      subtitle: 'Tarnime kvaliteetseid külmagaase HVAC, külmutus- ja tööstusrakendustele, tehes koostööd partneritega rahvusvahelistel turgudel.',
      cta: 'Võta ühendust',
    },
    about: {
      title: 'Meist',
      body: 'GasTrade Pro on usaldusväärne B2B külmagaasi kaubandusettevõte, millel on üle 15 aasta kogemust globaalsetel turgudel. Ühendame tootjaid turustajatega, tagades usaldusväärse tarneahela ja konkurentsivõimelise hinnakujunduse. Meie tööstusekspertide meeskond teeb klientidega tihedat koostööd, pakkudes kohandatud lahendusi nende konkreetsetele vajadustele.',
    },
    offers: {
      title: 'Mida pakume',
      items: [
        'Täielik valik HFC, HFO ja looduslikke külmaaineid (R-134a, R-410A, R-32, R-290, R-744 jm)',
        'Hulgi- ja balloonitarned paindliku logistikaga',
        'Konkurentsivõimeline hinnakujundus läbipaistvate tingimustega',
        'Regulatiivse vastavuse tugi ja dokumentatsioon',
        'Kohandatud segamine ja ümberpakendamine',
        'Pühendunud kontohaldus ja tehniline nõustamine',
      ],
    },
    contact: {
      title: 'Võta ühendust',
      intro: 'Kas teil on küsimus või olete valmis koostööks? Täitke allolev vorm ja meie meeskond vastab teile 24 tunni jooksul.',
      fields: {
        company: 'Ettevõtte nimi',
        person: 'Kontaktisik',
        email: 'E-posti aadress',
        message: 'Teie sõnum',
        consent: 'Nõustun oma isikuandmete töötlemisega vastavalt privaatsuspoliitikale.',
      },
      submit: 'Saada päring',
      success: 'Täname teid sõnumi eest. Võtame teiega peagi ühendust.',
    },
    footer: {
      copyright: '© 2026 GasTrade Pro. Kõik õigused kaitstud.',
    },
  },
};
