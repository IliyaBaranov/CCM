import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle } from 'lucide-react';

const OffersSection = () => {
  const { content } = useLanguage();

  return (
    <section id="offers" className="py-20 md:py-28 bg-muted">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-10">
            {content.offers.title}
          </h2>
          <ul className="space-y-5">
            {content.offers.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-foreground text-lg leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default OffersSection;
