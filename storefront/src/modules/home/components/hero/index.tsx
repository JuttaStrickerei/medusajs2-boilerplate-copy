import { useTranslations } from "next-intl";

const Hero = () => {
  const t = useTranslations('Homepage');

  return (
    <section
      className="relative h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        // Combines the gradient from the HTML's .hero-image style with your image
        backgroundImage:
          'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.2)), url("https://bucket-production-af40.up.railway.app/medusa-media/store-jutta-min.jpg")',
      }}
    >
      {/* This is the secondary gradient overlay from the HTML */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>

      {/* Content Wrapper */}
      <div className="relative z-10 text-center text-white max-w-2xl mx-auto px-6">
        
        {/* Text content with fade-in animation class */}
        <div className="fade-in stagger-1">
          <h1 className="font-serif text-5xl md:text-7xl font-medium mb-6 text-shadow">
            {t('title')} 
            {/* Example: "Handwerkskunst" */}
          </h1>
        </div>

        {/* Button with fade-in animation class */}
        <div className="fade-in stagger-2">
          <a
            href="/store" // Standard <a> tag
            className="inline-block bg-white text-stone-800 px-8 py-3 text-sm font-medium tracking-wide hover:bg-stone-100 transition-colors hover-lift"
          >
            {t('discoverCollection')}
            {/* Example: "KOLLEKTION ENTDECKEN" */}
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;