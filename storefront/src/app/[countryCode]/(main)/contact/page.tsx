import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Mail, Phone, MapPin, Clock } from "@components/icons"

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontaktieren Sie Strickerei Jutta - Wir freuen uns auf Ihre Nachricht.",
}

export default function ContactPage() {
  return (
    <div className="bg-stone-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-stone-200">
        <div className="content-container py-3">
          <nav className="flex text-sm text-stone-500">
            <LocalizedClientLink href="/" className="hover:text-stone-800 transition-colors">
              Home
            </LocalizedClientLink>
            <span className="mx-2">/</span>
            <span className="text-stone-800">Kontakt</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 bg-white">
        <div className="content-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-serif text-4xl small:text-5xl font-medium text-stone-800 mb-6">
              Kontaktieren Sie uns
            </h1>
            <p className="text-xl text-stone-600">
              Wir freuen uns auf Ihre Nachricht und stehen Ihnen gerne für alle Fragen 
              rund um unsere Produkte und Services zur Verfügung.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-stone-50">
        <div className="content-container">
          <div className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {/* Phone */}
            <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 hover:border-stone-800 hover:bg-stone-50 transition-all">
              <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone size={28} className="text-white" />
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-800 mb-4">Telefon</h3>
              <p className="text-stone-600 mb-4">
                Rufen Sie uns an für eine persönliche Beratung
              </p>
              <div className="space-y-1">
                <div className="font-medium text-stone-800">+43 2686 2259</div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 hover:border-stone-800 hover:bg-stone-50 transition-all">
              <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail size={28} className="text-white" />
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-800 mb-4">E-Mail</h3>
              <p className="text-stone-600 mb-4">
                Schreiben Sie uns eine Nachricht
              </p>
              <div className="space-y-1">
                <div className="font-medium text-stone-800">office@strickerei-jutta.at</div>
              </div>
            </div>

            {/* Visit */}
            <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 hover:border-stone-800 hover:bg-stone-50 transition-all">
              <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin size={28} className="text-white" />
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-800 mb-4">Besuchen Sie uns</h3>
              <p className="text-stone-600 mb-4">
                Erleben Sie unsere Produkte vor Ort
              </p>
              <div className="space-y-1">
                <div className="font-medium text-stone-800">Wiener Neustädterstraße 47</div>
                <div className="font-medium text-stone-800">7021 Draßburg</div>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 hover:border-stone-800 hover:bg-stone-50 transition-all">
              <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock size={28} className="text-white" />
              </div>
              <h3 className="font-serif text-xl font-medium text-stone-800 mb-4">Öffnungszeiten</h3>
              <p className="text-stone-600 mb-4">
                Unsere Geschäftszeiten
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Mo-Do</span>
                  <span className="font-medium text-stone-800">8:00 - 16:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Fr - Sa</span>
                  <span className="font-medium text-stone-800">8:00 - 12:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map & Directions */}
      <section className="py-16 bg-stone-50">
        <div className="content-container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-medium text-stone-800 mb-4">
              So finden Sie uns
            </h2>
            <p className="text-lg text-stone-600">
              Besuchen Sie uns in unserer Manufaktur in Draßburg
            </p>
          </div>
          
          <div className="grid grid-cols-1 medium:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Google Maps */}
            <div className="medium:col-span-2">
              <div className="rounded-2xl overflow-hidden aspect-[16/10]">
                <iframe
                  src="https://www.google.com/maps?q=47.7497514,16.482084&hl=de&z=15&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Standort Strickerei Strobl - Draßburg"
                  className="w-full h-full"
                />
              </div>
              <div className="mt-4 text-center">
                <a 
                  href="https://www.google.com/maps/place/Strickerei+Strobl/@47.7496977,16.4805415,304m/data=!3m1!1e3!4m6!3m5!1s0x476c30bf053f4555:0x5d518431581fd28c!8m2!3d47.7497514!4d16.482084!16s%2Fg%2F1tfcxltv?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-600 hover:text-stone-800 underline text-sm transition-colors"
                >
                  Route in Google Maps öffnen
                </a>
              </div>
            </div>
            
            {/* Directions */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-stone-200">
                <h3 className="font-medium text-stone-800 mb-4">Anfahrt mit dem Auto</h3>
                <ul className="text-sm text-stone-600 space-y-2">
                  <li>• von Wien: A3 Richtung Eisenstadt</li>
                  <li>• Kostenlose Parkplätze vorhanden</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-stone-200">
                <h3 className="font-medium text-stone-800 mb-4">Öffentliche Verkehrsmittel</h3>
                <ul className="text-sm text-stone-600 space-y-2">
                  <li>• von Wien: REX 6 bis Draßburg</li>
                  <li>• 15 Minuten Fußweg vom Bahnhof</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-white">
        <div className="content-container">
          <div className="max-w-3xl mx-auto">
            {/* Contact Form */}
            <div>
              <h2 className="font-serif text-3xl font-medium text-stone-800 mb-6">
                Nachricht senden
              </h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 small:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-800 mb-2">Vorname *</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-800 mb-2">Nachname *</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-800 mb-2">E-Mail-Adresse *</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-800 mb-2">Telefonnummer</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-800 mb-2">Betreff *</label>
                  <select 
                    required 
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 outline-none transition-all"
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="product">Produktanfrage</option>
                    <option value="custom">Maßanfertigung</option>
                    <option value="care">Pflegehinweise</option>
                    <option value="return">Rückgabe/Umtausch</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-800 mb-2">Nachricht *</label>
                  <textarea 
                    required 
                    rows={6} 
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:border-stone-800 focus:ring-2 focus:ring-stone-800/10 outline-none transition-all resize-none"
                    placeholder="Teilen Sie uns Ihr Anliegen mit..."
                  />
                </div>
                
                <div className="flex items-start space-x-3">
                  <input type="checkbox" id="privacy" required className="mt-1" />
                  <label htmlFor="privacy" className="text-sm text-stone-600">
                    Ich stimme der Verarbeitung meiner Daten gemäß der{" "}
                    <LocalizedClientLink href="/privacy" className="text-stone-800 underline hover:no-underline">
                      Datenschutzerklärung
                    </LocalizedClientLink>{" "}
                    zu. *
                  </label>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-stone-800 text-white py-4 rounded-lg font-medium hover:bg-stone-700 transition-colors"
                >
                  Nachricht senden
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="content-container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-medium text-stone-800 mb-4">
              Häufige Fragen
            </h2>
            <p className="text-lg text-stone-600">
              Antworten auf die wichtigsten Fragen rund um unsere Produkte und Services
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-stone-50 rounded-2xl p-6">
              <h3 className="font-medium text-stone-800 mb-3">Bieten Sie Maßanfertigungen an?</h3>
              <p className="text-stone-600">
                Ja, wir fertigen gerne individuelle Stücke nach Ihren Wünschen. 
                Kontaktieren Sie uns für ein persönliches Beratungsgespräch.
              </p>
            </div>
            
            <div className="bg-stone-50 rounded-2xl p-6">
              <h3 className="font-medium text-stone-800 mb-3">Wie lange dauert eine Maßanfertigung?</h3>
              <p className="text-stone-600">
                Maßanfertigung dauert bis zu 4 Wochen. 
                Genaue Termine besprechen wir gerne persönlich.
              </p>
            </div>
            
            <div className="bg-stone-50 rounded-2xl p-6">
              <h3 className="font-medium text-stone-800 mb-3">Welche Zahlungsmöglichkeiten gibt es?</h3>
              <p className="text-stone-600">
                Wir akzeptieren alle gängigen Kreditkarten, PayPal und Klarna.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
