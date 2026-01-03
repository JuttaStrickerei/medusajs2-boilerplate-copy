import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import { ArrowDown } from "@components/icons"

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] small:min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-stone-50 to-warm-100">
        {/* Decorative elements */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-stone-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-warm-200/30 rounded-full blur-3xl" />
        
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23292524' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 content-container text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
          {/* Tagline */}
          <p className="text-sm small:text-base text-stone-500 tracking-[0.2em] uppercase animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Österreichische Handwerkskunst
          </p>
          
          {/* Main Headline */}
          <h1 className="font-serif text-4xl small:text-5xl medium:text-6xl large:text-7xl font-medium text-stone-800 tracking-tight leading-[1.1]">
            <span className="block animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Drei Generationen
            </span>
            <span className="block text-stone-500 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              feinster Strickwaren
            </span>
          </h1>
          
          {/* CTA Buttons */}
          <div className="flex flex-col small:flex-row items-center justify-center gap-4 pt-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <LocalizedClientLink href="/store">
              <Button size="lg" className="min-w-[200px]">
                Kollektion entdecken
              </Button>
            </LocalizedClientLink>
            <LocalizedClientLink href="/about">
              <Button variant="secondary" size="lg" className="min-w-[200px]">
                Unsere Geschichte
              </Button>
            </LocalizedClientLink>
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-stone-500 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-sm">Handarbeit</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">100% Naturfasern</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">Made in Austria</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-stone-400 animate-bounce-soft">
        <span className="text-xs tracking-widest uppercase mb-2">Scrollen</span>
        <ArrowDown size={20} />
      </div>
    </section>
  )
}

export default Hero
