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
          <div className="grid grid-cols-1 small:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                <div className="text-sm text-stone-600">Mo-Fr: 9:00-17:00 Uhr</div>
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
                <div className="font-medium text-stone-800">info@strickerei-jutta.at</div>
                <div className="text-sm text-stone-600">Antwort innerhalb von 24h</div>
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
                <div className="font-medium text-stone-800">Hauptstraße 42</div>
                <div className="font-medium text-stone-800">7021 Draßburg</div>
                <div className="text-sm text-stone-600">Nach Terminvereinbarung</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 bg-white">
        <div className="content-container">
          <div className="grid grid-cols-1 medium:grid-cols-2 gap-12 max-w-6xl mx-auto">
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

            {/* Store Information */}
            <div className="space-y-8">
              {/* Store Image */}
              <div className="bg-stone-100 rounded-2xl aspect-[4/3] flex items-center justify-center">
                <span className="text-stone-400 font-serif">Strickerei Jutta</span>
              </div>
              
              {/* Opening Hours */}
              <div className="bg-gradient-to-br from-stone-100 to-stone-200 rounded-2xl p-6">
                <h3 className="font-serif text-xl font-medium text-stone-800 mb-4 flex items-center gap-2">
                  <Clock size={20} />
                  Öffnungszeiten
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Montag - Freitag</span>
                    <span className="font-medium text-stone-800">9:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Samstag</span>
                    <span className="font-medium text-stone-800">9:00 - 13:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Sonntag</span>
                    <span className="font-medium text-stone-800">Geschlossen</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-stone-300">
                  <p className="text-sm text-stone-600">
                    <strong>Hinweis:</strong> Besuche nach Terminvereinbarung möglich. 
                    Rufen Sie uns gerne an!
                  </p>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200">
                <h3 className="font-serif text-xl font-medium text-stone-800 mb-4">Kontaktdaten</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin size={20} className="text-stone-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-stone-800">Strickerei Jutta</div>
                      <div className="text-stone-600">Hauptstraße 42</div>
                      <div className="text-stone-600">7021 Draßburg, Österreich</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone size={20} className="text-stone-600 flex-shrink-0" />
                    <a href="tel:+4326862259" className="font-medium text-stone-800 hover:underline">
                      +43 2686 2259
                    </a>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail size={20} className="text-stone-600 flex-shrink-0" />
                    <a href="mailto:info@strickerei-jutta.at" className="font-medium text-stone-800 hover:underline">
                      info@strickerei-jutta.at
                    </a>
                  </div>
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
            {/* Map Placeholder */}
            <div className="medium:col-span-2">
              <div className="bg-stone-200 rounded-2xl aspect-[16/10] flex items-center justify-center">
                <span className="text-stone-400">Karte - Draßburg, Österreich</span>
              </div>
            </div>
            
            {/* Directions */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-stone-200">
                <h3 className="font-medium text-stone-800 mb-4">Anfahrt mit dem Auto</h3>
                <ul className="text-sm text-stone-600 space-y-2">
                  <li>• A4 Richtung Neusiedl am See</li>
                  <li>• Ausfahrt Draßburg</li>
                  <li>• 2 km Richtung Ortszentrum</li>
                  <li>• Kostenlose Parkplätze vorhanden</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-stone-200">
                <h3 className="font-medium text-stone-800 mb-4">Öffentliche Verkehrsmittel</h3>
                <ul className="text-sm text-stone-600 space-y-2">
                  <li>• S-Bahn S30 bis Draßburg</li>
                  <li>• 5 Minuten Fußweg vom Bahnhof</li>
                  <li>• Bus 263 Haltestelle "Hauptstraße"</li>
                </ul>
              </div>
              
              <div className="bg-stone-800 text-white rounded-2xl p-6">
                <h3 className="font-medium mb-3">Terminvereinbarung empfohlen</h3>
                <p className="text-sm text-stone-300 mb-4">
                  Für eine persönliche Beratung vereinbaren Sie gerne einen Termin mit uns.
                </p>
                <a 
                  href="tel:+4326862259"
                  className="inline-block bg-white text-stone-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors"
                >
                  Termin vereinbaren
                </a>
              </div>
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
                Je nach Komplexität des Stücks benötigen wir 4-8 Wochen für eine Maßanfertigung. 
                Genaue Termine besprechen wir gerne persönlich.
              </p>
            </div>
            
            <div className="bg-stone-50 rounded-2xl p-6">
              <h3 className="font-medium text-stone-800 mb-3">Welche Zahlungsmöglichkeiten gibt es?</h3>
              <p className="text-stone-600">
                Wir akzeptieren alle gängigen Kreditkarten, PayPal, Klarna und Banküberweisung. 
                Bei Maßanfertigungen ist eine Anzahlung von 50% erforderlich.
              </p>
            </div>
            
            <div className="bg-stone-50 rounded-2xl p-6">
              <h3 className="font-medium text-stone-800 mb-3">Versenden Sie auch international?</h3>
              <p className="text-stone-600">
                Ja, wir versenden in alle EU-Länder sowie in die Schweiz und nach Liechtenstein. 
                Für andere Länder kontaktieren Sie uns bitte direkt.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
