import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description:
    "Datenschutzerklärung der Jutta Strickerei gemäß DSGVO, DSG und TKG 2021.",
}

export default function PrivacyPage() {
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
            <span className="text-stone-800">Datenschutz</span>
          </nav>
        </div>
      </div>

      <div className="py-12 small:py-20">
        <div className="content-container">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-stone-200 p-8 small:p-12">
              <h1 className="font-serif text-3xl font-medium text-stone-800 mb-8">
                Datenschutzerklärung der Jutta Strickerei
              </h1>

              <div className="prose prose-stone max-w-none">
                <p className="text-stone-600 mb-4">
                  Der Schutz und die Sicherheit Ihrer persönlichen Daten sind uns ein besonderes
                  Anliegen. Wir verarbeiten Ihre Daten daher strikt und ausschließlich auf
                  Grundlage der geltenden gesetzlichen Bestimmungen, insbesondere der Europäischen
                  Datenschutz-Grundverordnung (DSGVO), des österreichischen Datenschutzgesetzes
                  (DSG) sowie des Telekommunikationsgesetzes (TKG 2021). In diesen umfassenden
                  Datenschutzinformationen klären wir Sie detailliert über die Art, den Umfang, die
                  Zwecke und die Rechtsgrundlagen der Datenverarbeitung im Rahmen unseres Webshops
                  auf.
                </p>
                <p className="text-stone-600 mb-6">Stand: April 2026</p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  1. Identität und Kontaktdaten des Verantwortlichen
                </h2>
                <p className="text-stone-600 mb-4">
                  Verantwortlich für die Erhebung, Verarbeitung und Nutzung Ihrer
                  personenbezogenen Daten im Sinne der DSGVO ist: Ing. Jutta Strobl; Wiener
                  Neustädterstraße 47, 7021 Draßburg, Österreich; E-Mail:{" "}
                  <a
                    href="mailto:office@strickerei-jutta.at"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    office@strickerei-jutta.at
                  </a>
                  ; Telefon:{" "}
                  <a
                    href="tel:+4326862259"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    +43 2686 2259
                  </a>
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  2. Erfassung und Verarbeitung von Server-Logfiles (Hosting)
                </h2>
                <p className="text-stone-600 mb-4">
                  Bei der rein informatorischen Nutzung unserer Website, also wenn Sie sich nicht
                  registrieren oder uns anderweitig Informationen übermitteln, erheben wir nur die
                  personenbezogenen Daten, die Ihr Browser automatisiert an unseren Server
                  übermittelt (sogenannte Server-Logfiles). Wenn Sie unsere Website aufrufen,
                  erheben wir technische Daten wie Ihre IP-Adresse, Datum und Uhrzeit der Anfrage,
                  Zeitzonendifferenz, abgerufene URL/Datei, den HTTP-Statuscode, die Website, von der
                  aus der Zugriff erfolgt (Referrer-URL), sowie Informationen über Ihren Browser
                  und das genutzte Betriebssystem. Zweck und Rechtsgrundlage: Diese Daten sind für
                  uns technisch zwingend erforderlich, um Ihnen unsere Website fehlerfrei
                  anzuzeigen und die dauerhafte Stabilität und Sicherheit der informationstechnischen
                  Systeme zu gewährleisten (z. B. zur Abwehr von DDoS-Angriffen). Die
                  Rechtsgrundlage für diese Verarbeitung ist unser berechtigtes Interesse an der
                  Bereitstellung eines funktionsfähigen Webshops gemäß Art. 6 Abs. 1 lit. f DSGVO.
                  Speicherdauer: Diese Daten werden auf den Servern unseres Hosting-Providers
                  (welcher als Auftragsverarbeiter gemäß Art. 28 DSGVO für uns tätig ist) in der
                  Regel nach einer kurzen Frist (z. B. nach 7 bis 14 Tagen) automatisiert
                  überschrieben oder gelöscht, sofern keine weitere Aufbewahrung zu zwingenden
                  Beweiszwecken erforderlich ist.
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  3. Datenverarbeitung bei direkter Kontaktaufnahme
                </h2>
                <p className="text-stone-600 mb-4">
                  Wenn Sie per E-Mail, Telefon oder über ein mögliches Kontaktformular mit uns in
                  Verbindung treten, werden die von Ihnen freiwillig mitgeteilten Daten (insbesondere
                  Ihre E-Mail-Adresse, ggf. Ihr Vor- und Nachname und Ihre Telefonnummer sowie der
                  Inhalt Ihrer Nachricht) von uns gespeichert, um Ihre individuellen Fragen zu
                  beantworten. Zweck und Rechtsgrundlage: Die Verarbeitung dieser Daten erfolgt auf
                  Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage direkt mit der
                  Erfüllung eines bestehenden Vertrags zusammenhängt oder zur Durchführung
                  vorvertraglicher Maßnahmen (z. B. Fragen zu einem bestimmten Produkt vor dem Kauf)
                  erforderlich ist. In allen übrigen Fällen beruht die Verarbeitung auf unserem
                  berechtigten Interesse an der effektiven, zeitnahen Bearbeitung der an uns
                  gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO). Speicherdauer: Wir löschen die
                  in diesem Zusammenhang anfallenden Kommunikationsdaten, wenn die jeweilige
                  Konversation beendet ist und der zugrundeliegende Sachverhalt abschließend geklärt
                  wurde, sofern keine zwingenden gesetzlichen Aufbewahrungspflichten (z. B. bei der
                  Anbahnung eines Geschäftsabschlusses) einer Löschung entgegenstehen.
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  4. Datenverarbeitung im Rahmen des Webshops und der Vertragsabwicklung
                </h2>
                <p className="text-stone-600 mb-4">
                  Zum Zweck eines reibungslosen Einkaufsvorganges und zur späteren Erfüllung des
                  Kaufvertrages werden in unserem Webshop folgende Datenkategorien von Ihnen
                  verarbeitet: Anrede, Vorname, Nachname, vollständige Rechnungs- und Lieferadresse,
                  E-Mail-Adresse, Telefonnummer für Rückfragen zur Zustellung sowie die von Ihnen
                  gewählten Zahlungsdaten (z. B. Kontodaten, Kreditkarteninformationen,
                  PayPal-Kennungen). Zweck und Rechtsgrundlage: Die Bereitstellung und Verarbeitung
                  dieser Daten ist zur Vertragserfüllung bzw. zur Durchführung vorvertraglicher
                  Maßnahmen zwingend erforderlich. Ohne diese Daten können wir den Kaufvertrag mit
                  Ihnen nicht rechtsgültig abschließen und die Ware nicht versenden. Die
                  Rechtsgrundlage für diese Verarbeitungsvorgänge ist Art. 6 Abs. 1 lit. b DSGVO.
                  Datenübermittlung an Dritte (Empfängerkategorien): Eine Übermittlung Ihrer
                  personenbezogenen Daten erfolgt ausschließlich an ausgewählte Dritte, soweit dies
                  zur Vertragsabwicklung unerlässlich ist. Hierzu zählen streng zweckgebunden:
                </p>
                <ul className="text-stone-600 mb-4 list-disc pl-6 space-y-2">
                  <li>
                    Von Ihnen gewählte Bankinstitute bzw. externe Zahlungsdienstleister zum Zwecke
                    der sicheren Abbuchung des Einkaufspreises.
                  </li>
                  <li>
                    Von uns beauftragte Transport- und Logistikunternehmen (z. B. Post,
                    Paketdienste) zur physischen Zustellung der gekauften Ware.
                  </li>
                  <li>
                    Unser Steuerberater und Buchhaltungsdienstleister zur Erfüllung unserer
                    zwingenden steuerrechtlichen und buchhalterischen Pflichten. Hierbei fungiert Art.
                    6 Abs. 1 lit. c DSGVO als Rechtsgrundlage.
                  </li>
                </ul>
                <p className="text-stone-600 mb-4">
                  Speicherdauer und gesetzliche Fristen: Nach einem vollständigen Abbruch des
                  Einkaufsvorganges werden die temporär in den Formularen gespeicherten Daten zeitnah
                  gelöscht. Im Falle eines erfolgreichen Vertragsabschlusses werden sämtliche
                  abrechnungsrelevanten Daten aus dem Vertragsverhältnis in unserer Buchhaltung bis
                  zum Ablauf der steuer- und unternehmensrechtlichen Aufbewahrungsfrist von 7 Jahren
                  gemäß § 132 Bundesabgabenordnung (BAO) und § 212 Unternehmensgesetzbuch (UGB)
                  systematisch gespeichert. Daten, die den Namen, die Anschrift, die spezifisch
                  gekauften Waren und das exakte Kaufdatum umfassen, werden darüber hinaus zur
                  Abwehr oder Erfüllung von Ansprüchen aus der Produkthaftung bis zum Ablauf von 10
                  Jahren gemäß § 13 Produkthaftungsgesetz (PHG) sicher aufbewahrt.
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  5. Newsletter-Marketing und elektronische Direktwerbung (Mailchimp)
                </h2>
                <p className="text-stone-600 mb-4">
                  Sie haben die Möglichkeit, über eine Anmeldemaske auf unserer Website unseren
                  informativen Newsletter zu abonnieren. Hierfür benötigen wir lediglich Ihre
                  E-Mail-Adresse sowie Ihre unmissverständliche Erklärung, dass Sie mit dem
                  regelmäßigen Bezug des Newsletters einverstanden sind. Zweck und Rechtsgrundlage:
                  Der Versand des Newsletters und die damit verbundene statistische Erfolgsmessung
                  erfolgen ausschließlich auf Grundlage Ihrer vorherigen, ausdrücklichen und
                  freiwilligen Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO in Verbindung mit den
                  Vorgaben des § 174 TKG 2021. Dienstleister Mailchimp und Drittlandübermittlung
                  (USA): Der technische Versand unserer Newsletter erfolgt unter Einschaltung des
                  professionellen Versanddienstleisters „Mailchimp“, einer Plattform des
                  US-amerikanischen Technologieunternehmens Intuit Inc., 2700 Coast Avenue,
                  Mountain View, CA 94043, USA. Ihre Daten (E-Mail-Adresse, IP-Adresse, exakter
                  Zeitpunkt der Anmeldung zur Erfüllung unserer Nachweispflicht) werden auf den
                  hochsicheren Servern von Mailchimp in den USA verarbeitet und gespeichert. Wir
                  haben mit Mailchimp einen datenschutzrechtlichen Auftragsverarbeitungsvertrag
                  gemäß Art. 28 DSGVO abgeschlossen. Die Intuit Inc. ist offiziell unter dem EU-US
                  Data Privacy Framework (DPF) zertifiziert. Durch das DPF und den entsprechenden
                  Angemessenheitsbeschluss der Europäischen Kommission wird rechtlich gewährleistet,
                  dass bei der Datenverarbeitung in den USA ein europäisches Datenschutzniveau strikt
                  eingehalten wird. Die Übermittlung ist somit nach Art. 45 DSGVO legitimiert.
                  Erfolgsmessung (Tracking): Die über Mailchimp versendeten Newsletter enthalten
                  sogenannte „web-beacons“ (Zählpixel). Diese winzigen Grafiken ermöglichen es uns,
                  technische Informationen (z. B. den verwendeten E-Mail-Client, Ihre IP-Adresse) zu
                  erfassen und statistisch auszuwerten, ob der Newsletter geöffnet wurde und welche
                  spezifischen Links geklickt wurden. Diese Auswertung dient ausschließlich dazu,
                  die Lesegewohnheiten unserer Nutzer zu erkennen und unsere Inhalte entsprechend zu
                  optimieren. Widerrufsrecht: Sie können das Abonnement des Newsletters und die
                  damit verbundene Einwilligung jederzeit kostenlos und ohne Angabe von Gründen
                  stornieren. In jedem Newsletter findet sich dazu ein entsprechender, leicht
                  zugänglicher Abmelde-Link {'"Unsubscribe"'}. Alternativ können Sie Ihren
                  Widerruf auch jederzeit formlos an{" "}
                  <a
                    href="mailto:office@strickerei-jutta.at"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    office@strickerei-jutta.at
                  </a>{" "}
                  senden. Die Rechtmäßigkeit der bis zum Zugang des Widerrufs erfolgten
                  Datenverarbeitung wird dadurch nicht berührt. Nach der Abmeldung wird Ihre
                  E-Mail-Adresse aus der aktiven Versandliste gelöscht.
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  6. Einsatz von Cookies und lokalen Speichertechnologien
                </h2>
                <p className="text-stone-600 mb-4">
                  Unsere Website verwendet Cookies und vergleichbare Technologien (z. B. Local
                  Storage). Dabei handelt es sich um kleine, unschädliche Textdateien, die mit Hilfe
                  Ihres Webbrowsers lokal auf Ihrem Endgerät abgelegt werden. Sie richten auf Ihrem
                  Rechner keinen Schaden an und enthalten keine Viren. Technisch notwendige
                  Cookies: Einige Cookies sind technisch zwingend erforderlich, um Grundfunktionen
                  unserer E-Commerce-Plattform (wie beispielsweise die Verwaltung Ihrer Session, das
                  reibungslose Funktionieren des Warenkorbs oder die sichere Speicherung Ihrer im
                  Consent-Banner getroffenen Datenschutzeinstellungen) überhaupt zu gewährleisten.
                  Diese essenziellen Cookies setzen wir auf Basis unseres überwiegenden
                  berechtigten Interesses an einer funktionalen Bereitstellung unserer Dienste gemäß
                  Art. 6 Abs. 1 lit. f DSGVO in Verbindung mit der klaren gesetzlichen
                  Ausnahmevorschrift des § 165 Abs. 3 TKG 2021 ein. Hierfür ist keine aktive
                  Einwilligung Ihrerseits erforderlich und diese können im Banner nicht deaktiviert
                  werden. Einwilligungspflichtige Cookies (Analyse und Marketing): Alle anderen
                  Cookies, die nicht primär der Kernfunktion der Website dienen, sondern dazu
                  genutzt werden, Ihr spezifisches Nutzerverhalten zu analysieren (Tracking), werden
                  auf unseren Seiten streng blockiert und ausschließlich dann geladen, wenn Sie uns
                  vorab über unser Cookie-Banner (Consent Management Platform) Ihre ausdrückliche,
                  aktive und informierte Einwilligung erteilt haben. Die Rechtsgrundlage hierfür ist
                  Art. 6 Abs. 1 lit. a DSGVO in Verbindung mit § 165 Abs. 3 TKG 2021. Widerruf Ihrer
                  Cookie-Auswahl: Sie behalten die volle Kontrolle. Sie können Ihre initial
                  getroffenen Cookie-Einstellungen jederzeit anpassen und einmal erteilte
                  Einwilligungen für die Zukunft widerrufen, indem Sie unser Cookie-Banner über den
                  Link „Datenschutzeinstellungen“ (zu finden am unteren Rand der Website) erneut
                  aufrufen.
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  7. Detaillierte Webanalyse mit Google Analytics 4 (GA4)
                </h2>
                <p className="text-stone-600 mb-4">
                  Ausschließlich dann, wenn Sie uns hierzu im Cookie-Banner Ihre aktive Einwilligung
                  erteilt haben (Art. 6 Abs. 1 lit. a DSGVO), nutzen wir auf dieser
                  E-Commerce-Plattform Google Analytics 4, einen umfassenden Webanalysedienst der Google
                  Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland („Google“). Zweck
                  der Verarbeitung: Google Analytics verwendet spezifische Analyse-Cookies (wie z.
                  B. _ga mit einer Laufzeit von 2 Jahren und _gid mit einer Laufzeit von 24
                  Stunden), die eine tiefgehende Analyse der Benutzung der Website durch Sie
                  ermöglichen. Die durch das Cookie erzeugten Informationen über Ihre Benutzung
                  dieser Website werden an Server von Google übertragen und dort strukturiert
                  gespeichert. Wir nutzen diese aggregierten Daten, um die Nutzung unserer Website
                  statistisch auszuwerten, Reports über die Website-Aktivitäten zusammenzustellen und
                  um die Benutzerfreundlichkeit unseres Webshops kontinuierlich zu verbessern.
                  IP-Anonymisierung und Schutzmaßnahmen: Wir haben bei der Nutzung von GA4 die
                  datenschutzfreundlichsten Einstellungen gewählt. In GA4 ist die IP-Anonymisierung
                  zwingend standardmäßig aktiviert. Das bedeutet, dass Ihre IP-Adresse von Google
                  innerhalb von Mitgliedstaaten der Europäischen Union vor einer eventuellen
                  Übermittlung in die USA technisch gekürzt und somit pseudonymisiert wird. Eine
                  direkte, einfache Personenbeziehbarkeit wird dadurch für uns ausgeschlossen.
                  Drittlandübermittlung in die USA und DPF: Im Rahmen der technischen Infrastruktur
                  von Google Analytics können pseudonymisierte Daten zur weiteren Verarbeitung an
                  die globalen Server der Muttergesellschaft Google LLC in den USA übermittelt
                  werden. Die Google LLC ist offiziell nach dem EU-US Data Privacy Framework (DPF)
                  zertifiziert. Da für Unternehmen, die nach dem DPF zertifiziert sind, ein gültiger
                  Angemessenheitsbeschluss der Europäischen Kommission vorliegt, der ein der EU
                  äquivalentes Datenschutzniveau bestätigt, erfolgt die Datenübermittlung in die USA
                  rechtmäßig und sicher auf Basis von Art. 45 DSGVO. Um die rechtlichen Ketten zu
                  schließen, haben wir zudem einen detaillierten Auftragsverarbeitungsvertrag mit der
                  Google Ireland Limited abgeschlossen. Datenminimierung und Speicherdauer: Wir haben
                  die Datenspeicherdauer für die auf Nutzer- und Ereignisebene verknüpften Daten in
                  den Systemeinstellungen von Google Analytics auf das absolute rechtliche Minimum
                  von 2 Monaten restriktiv konfiguriert. Nach Ablauf dieser kurzen Frist werden die
                  Daten endgültig und automatisch von den Google-Servern gelöscht.
                  Widerrufsmöglichkeit: Sie können Ihre Einwilligung jederzeit mit Wirkung für die
                  Zukunft unkompliziert widerrufen, indem Sie Ihre Präferenzen in unserem
                  Cookie-Banner entsprechend anpassen. Alternativ können Sie die generelle Erfassung Ihrer
                  Daten durch Google Analytics auf allen Websites unterbinden, indem Sie das unter
                  dem folgenden Link verfügbare Browser-Add-on von Google herunterladen und in
                  Ihrem Browser installieren:{" "}
                  <a
                    href="https://tools.google.com/dlpage/gaoptout?hl=de"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600 break-all"
                  >
                    https://tools.google.com/dlpage/gaoptout?hl=de
                  </a>
                  .
                </p>

                <h2 className="font-serif text-xl font-medium text-stone-800 mt-8 mb-4">
                  8. Ihre weitreichenden Rechte als betroffene Person
                </h2>
                <p className="text-stone-600 mb-4">
                  Der europäische Gesetzgeber räumt Ihnen durch die DSGVO umfassende und starke
                  Rechte bezüglich Ihrer von uns verarbeiteten personenbezogenen Daten ein. Zur
                  Wahrung dieser Rechte können Sie sich jederzeit formlos an uns wenden:
                </p>
                <div className="overflow-x-auto -mx-2 small:mx-0 mb-6">
                  <table className="w-full min-w-[min(100%,520px)] text-sm text-stone-600 border border-stone-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-stone-100">
                        <th
                          scope="col"
                          className="text-left font-medium text-stone-800 p-3 small:p-4 border-b border-stone-200 align-top w-[38%]"
                        >
                          Das DSGVO-Recht
                        </th>
                        <th
                          scope="col"
                          className="text-left font-medium text-stone-800 p-3 small:p-4 border-b border-stone-200 border-l border-stone-200 align-top"
                        >
                          Bedeutung für Sie als Nutzer
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-stone-200">
                        <td className="p-3 small:p-4 align-top">
                          Auskunftsrecht (Art. 15 DSGVO)
                        </td>
                        <td className="p-3 small:p-4 border-l border-stone-200 align-top">
                          Sie haben das Recht, eine formelle Bestätigung darüber zu verlangen, ob wir
                          personenbezogene Daten von Ihnen verarbeiten. Ist dies der Fall, haben Sie
                          ein Recht auf umfassende Auskunft über diese Daten, die Verarbeitungszwecke,
                          die Speicherdauer und die Empfänger.
                        </td>
                      </tr>
                      <tr className="border-b border-stone-200">
                        <td className="p-3 small:p-4 align-top">
                          Recht auf Berichtigung (Art. 16 DSGVO)
                        </td>
                        <td className="p-3 small:p-4 border-l border-stone-200 align-top">
                          Sie haben das Recht, die unverzügliche Berichtigung unrichtiger Daten oder
                          die Vervollständigung unvollständiger Daten in unseren Systemen zu
                          verlangen (z. B. bei einer Namensänderung oder fehlerhaften Adresse).
                        </td>
                      </tr>
                      <tr className="border-b border-stone-200">
                        <td className="p-3 small:p-4 align-top">
                          Recht auf Löschung / „Recht auf Vergessenwerden“ (Art. 17 DSGVO)
                        </td>
                        <td className="p-3 small:p-4 border-l border-stone-200 align-top">
                          Sie können unter bestimmten Bedingungen die endgültige Löschung Ihrer Daten
                          verlangen, insbesondere wenn diese für die Zwecke, für die sie erhoben
                          wurden, nicht mehr notwendig sind, wenn Sie Ihre Einwilligung widerrufen
                          haben oder wenn die Daten unrechtmäßig verarbeitet wurden (sofern keine
                          gesetzlichen Fristen nach BAO/UGB entgegenstehen).
                        </td>
                      </tr>
                      <tr className="border-b border-stone-200">
                        <td className="p-3 small:p-4 align-top">
                          Recht auf Einschränkung (Art. 18 DSGVO)
                        </td>
                        <td className="p-3 small:p-4 border-l border-stone-200 align-top">
                          Sie können verlangen, dass wir die Verarbeitung Ihrer Daten blockieren bzw.
                          einschränken, wenn beispielsweise die Richtigkeit der Daten von Ihnen
                          bestritten wird.
                        </td>
                      </tr>
                      <tr className="border-b border-stone-200">
                        <td className="p-3 small:p-4 align-top">
                          Recht auf Datenübertragbarkeit (Art. 20 DSGVO)
                        </td>
                        <td className="p-3 small:p-4 border-l border-stone-200 align-top">
                          Sie haben das Recht, die uns direkt bereitgestellten Daten in einem
                          strukturierten, gängigen und maschinenlesbaren Format zu erhalten, um sie
                          beispielsweise an einen anderen Dienstleister zu übermitteln.
                        </td>
                      </tr>
                      <tr className="border-b border-stone-200">
                        <td className="p-3 small:p-4 align-top">
                          Widerspruchsrecht (Art. 21 DSGVO)
                        </td>
                        <td className="p-3 small:p-4 border-l border-stone-200 align-top">
                          Verarbeiten wir Ihre Daten auf Basis unseres überwiegenden berechtigten
                          Interesses (Art. 6 Abs. 1 lit. f DSGVO) oder für Zwecke der Direktwerbung,
                          können Sie dieser Verarbeitung aus Gründen, die sich aus Ihrer besonderen
                          Situation ergeben, jederzeit widersprechen.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 small:p-4 align-top">
                          Widerrufsrecht bei Einwilligungen (Art. 7 Abs. 3 DSGVO)
                        </td>
                        <td className="p-3 small:p-4 border-l border-stone-200 align-top">
                          Sie können eine uns einmal erteilte datenschutzrechtliche Einwilligung (z.
                          B. für Analyse-Cookies oder den Newsletter) jederzeit, ohne Angabe von
                          Gründen, mit Wirkung für die Zukunft widerrufen.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-stone-600 mb-4">
                  Zur formlosen Ausübung Ihrer Rechte wenden Sie sich bitte bevorzugt per E-Mail an{" "}
                  <a
                    href="mailto:office@strickerei-jutta.at"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    office@strickerei-jutta.at
                  </a>{" "}
                  oder postalisch an unsere im Impressum und unter Punkt 1 angegebene
                  Unternehmensadresse.
                </p>
                <p className="text-stone-600 mb-4">
                  <strong className="text-stone-800 font-medium">
                    Beschwerderecht bei der Aufsichtsbehörde:
                  </strong>{" "}
                  Wenn Sie trotz unseres Bemühens um datenschutzkonformes Handeln der Ansicht sind,
                  dass die Verarbeitung Ihrer personenbezogenen Daten gegen das europäische oder
                  nationale Datenschutzrecht verstößt oder Ihre datenschutzrechtlichen Ansprüche in
                  sonstiger, unzulässiger Weise verletzt worden sind, haben Sie gemäß Art. 77 DSGVO
                  das uneingeschränkte Recht, sich bei der zuständigen Aufsichtsbehörde zu
                  beschweren. In Österreich ist die hierfür zuständige und weisungsfreie Instanz die:
                </p>
                <address className="text-stone-600 not-italic mb-0">
                  Österreichische Datenschutzbehörde (DSB)
                  <br />
                  Barichgasse 40-42, 1030 Wien
                  <br />
                  Telefon:{" "}
                  <a
                    href="tel:+431521520"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    +43 1 52 152-0
                  </a>
                  <br />
                  E-Mail:{" "}
                  <a
                    href="mailto:dsb@dsb.gv.at"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    dsb@dsb.gv.at
                  </a>
                  <br />
                  Website:{" "}
                  <a
                    href="https://www.dsb.gv.at"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-800 underline underline-offset-2 hover:text-stone-600"
                  >
                    www.dsb.gv.at
                  </a>
                </address>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
