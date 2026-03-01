import { useLanguage } from '@/contexts/LanguageContext';

const HeroSection = () => {
  const { content } = useLanguage();

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="gradient-hero min-h-[85vh] flex items-center pt-16">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-foreground leading-tight mb-6">
            {content.hero.title}
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl leading-relaxed">
            {content.hero.subtitle}
          </p>
          <button
            onClick={scrollToContact}
            className="gradient-accent px-8 py-4 rounded-lg text-accent-foreground font-semibold text-lg hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {content.hero.cta}
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
