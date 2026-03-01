import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

const Header = () => {
  const { content, language, setLanguage } = useLanguage();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="font-heading text-xl font-bold text-primary tracking-tight">
          GasTrade Pro
        </a>

        <nav className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo('about')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            {content.nav.about}
          </button>
          <button onClick={() => scrollTo('offers')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            {content.nav.offers}
          </button>
          <button onClick={() => scrollTo('contact')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            {content.nav.contact}
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => setLanguage(language === 'en' ? 'et' : 'en')}
            className="text-sm font-medium text-accent hover:text-foreground transition-colors px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Switch language"
          >
            {language === 'en' ? 'ET' : 'EN'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
