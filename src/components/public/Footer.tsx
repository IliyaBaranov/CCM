import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { content } = useLanguage();

  return (
    <footer className="bg-primary py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-primary-foreground/70 text-sm">{content.footer.copyright}</p>
      </div>
    </footer>
  );
};

export default Footer;
