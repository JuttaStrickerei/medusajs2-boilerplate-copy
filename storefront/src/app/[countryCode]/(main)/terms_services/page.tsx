
import { NextPage } from "next";

const PrivacyAndTerms: NextPage = () => {
  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "2rem auto",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.6",
        color: "#333",
      }}
    >
      <header style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1>Datenschutzerklärung &amp; Terms and Services</h1>
      </header>

      {/* Datenschutzerklärung */}
      <section style={{ marginBottom: "3rem" }}>
        <h2>Datenschutzerklärung</h2>
        <p>
          Wir freuen uns über Ihr Interesse an unserem Online-Shop für hochwertige
          Textilprodukte. Der Schutz Ihrer personenbezogenen Daten hat für uns höchste
          Priorität. Nachfolgend informieren wir Sie über die Erhebung, Verarbeitung und
          Nutzung Ihrer Daten im Rahmen der Nutzung unserer Website.
        </p>
        <h3>1. Verantwortliche Stelle</h3>
        <p>
          Verantwortlich für die Datenverarbeitung ist:
          <br />
          <strong>Textilunternehmen Muster GmbH</strong>
          <br />
          Musterstraße 1, 12345 Musterstadt
          <br />
          E-Mail: datenschutz@mustertextilien.de
        </p>
        <h3>2. Erhebung und Speicherung personenbezogener Daten</h3>
        <p>
          Beim Besuch unserer Website werden automatisch Informationen allgemeiner Art
          erfasst. Diese Informationen (Server-Logfiles) beinhalten z. B. IP-Adressen,
          Browsertyp, Betriebssystem, Datum und Uhrzeit des Zugriffs sowie die
          Website, von der aus der Zugriff erfolgt. Diese Daten werden ausschließlich zur
          Gewährleistung der Systemsicherheit und zur Fehlerbehebung verwendet.
        </p>
        <h3>3. Nutzung und Weitergabe Ihrer Daten</h3>
        <p>
          Ihre personenbezogenen Daten werden ausschließlich zur Bearbeitung Ihrer
          Bestellungen, zur Bereitstellung unserer Dienste und zur Kommunikation mit Ihnen
          verwendet. Eine Weitergabe an Dritte erfolgt nur, soweit dies zur Vertragsabwicklung
          notwendig ist oder Sie ausdrücklich eingewilligt haben.
        </p>
        <h3>4. Ihre Rechte</h3>
        <p>
          Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung
          der Verarbeitung Ihrer personenbezogenen Daten. Bitte kontaktieren Sie uns hierzu
          unter den oben genannten Kontaktdaten.
        </p>
        <p>
          Bei Fragen zum Datenschutz können Sie sich jederzeit an unseren Datenschutzbeauftragten
          wenden.
        </p>
      </section>

      {/* Terms and Services */}
      <section>
        <h2>Terms and Services</h2>
        <p>
          Welcome to our online textile shop. These Terms and Services govern your access to
          and use of our website and the services we provide. Please read them carefully before
          using our site.
        </p>
        <h3>1. Acceptance of Terms</h3>
        <p>
          By accessing and using our website, you agree to be bound by these Terms and Services.
          If you do not agree with any part of these terms, please do not use our website.
        </p>
        <h3>2. Use of the Website</h3>
        <p>
          You agree to use the website only for lawful purposes and in a manner that does not
          infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the
          website.
        </p>
        <h3>3. Intellectual Property</h3>
        <p>
          All content on this website, including text, images, logos, and graphics, is the
          property of our company or its content suppliers and is protected by intellectual
          property laws.
        </p>
        <h3>4. Limitation of Liability</h3>
        <p>
          Our company shall not be liable for any indirect, incidental, or consequential damages
          arising out of or in connection with your use of the website or the services provided.
        </p>
        <h3>5. Governing Law</h3>
        <p>
          These Terms and Services shall be governed by and construed in accordance with the laws
          of the Federal Republic of Germany.
        </p>
      </section>
    </div>
  );
};

export default PrivacyAndTerms;
