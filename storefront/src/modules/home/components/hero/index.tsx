import { Heading } from "@medusajs/ui";
import { useTranslations } from "next-intl";

const Hero = () => {
  const t = useTranslations('Homepage');

  return (
    <div className="flex flex-col items-center justify-center py-12 border-b border-ui-border-base">
      <div className="text-center mb-16"> {/* Increased bottom margin */}
        <Heading level="h1">{t('title')}</Heading>
      </div>
      
      <div className="relative inline-block w-full max-w-5xl">
        <img 
          src="https://bucket-production-af40.up.railway.app/medusa-media/store-jutta-min.jpg" 
          alt="Exterior of a modern store" 
          className="
            block w-full h-auto
            [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent),linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]
            [mask-composite:intersect]
          "
        />
        
        <a 
          href="/store"
          aria-label="Enter the store"
          className="
            absolute 
            top-[38%] left-[47%] w-[11%] h-[29%]
            hover:bg-black/10
            transition-colors
          "
        >
        </a>
      </div>
    </div>
  );
};

export default Hero;