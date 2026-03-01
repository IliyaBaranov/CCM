import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language, CmsContent, cmsData } from '@/data/cmsContent';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  content: CmsContent;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  const content = cmsData[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, content }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
