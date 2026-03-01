import { useLanguage } from '@/contexts/LanguageContext';

const AboutSection = () => {
  const { content } = useLanguage();

  return (
    <section id="about" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-8">
            {content.about.title}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {content.about.body}
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
