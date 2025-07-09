import { Heading } from "@medusajs/ui";
import { useTranslations } from "next-intl";
import ImageSlideshow from "./imageslideshow"; // Import the new client component

const Hero = () => {
  const t = useTranslations('Homepage');

  return (
    <div className="flex flex-col items-center justify-center py-12 border-b border-ui-border-base">
      <div className="text-center mb-8">
        <Heading level="h1">{t('title')}</Heading>
      </div>
      
      <ImageSlideshow />
    </div>
  );
};

export default Hero;