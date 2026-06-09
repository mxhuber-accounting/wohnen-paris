export async function generateMetadata() {
  return { title: 'Datenschutz — Wohnen Abroad' };
}

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-serif text-3xl font-semibold text-stone-900">Datenschutzerklärung</h1>
      <div className="space-y-6 text-sm leading-relaxed text-stone-700">
        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-stone-900">1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
            <strong>[Dein vollständiger Name]</strong><br />
            [Adresse]<br />
            E-Mail: [deine@email.de]
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-stone-900">2. Welche Daten wir erheben</h2>
          <p>
            Wir erheben und verarbeiten folgende personenbezogene Daten:
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>E-Mail-Adresse (für die Anmeldung via Magic Link)</li>
            <li>Anzeigename (freiwillig, von dir selbst gesetzt)</li>
            <li>Inhalte von Anzeigen, die du veröffentlichst</li>
            <li>Nachrichten, die du über die Plattform sendest</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-stone-900">3. Zweck der Verarbeitung</h2>
          <p>
            Die Daten werden ausschließlich zur Bereitstellung der Plattform-Dienste genutzt: Anmeldung,
            Veröffentlichung von Anzeigen und Kommunikation zwischen Nutzern.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-stone-900">4. Hosting & Infrastruktur</h2>
          <p>
            Diese Website wird gehostet bei <strong>Vercel Inc.</strong> (440 N Barranca Ave #4133,
            Covina, CA 91723, USA). Die Datenbank wird betrieben von <strong>Supabase Inc.</strong>.
            Beide Anbieter verarbeiten Daten gemäß ihrer eigenen Datenschutzrichtlinien.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-stone-900">5. Deine Rechte</h2>
          <p>Du hast das Recht auf:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
            <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
            <li>Löschung deiner Daten (Art. 17 DSGVO)</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          </ul>
          <p className="mt-2">
            Zur Ausübung deiner Rechte wende dich an: <a href="mailto:[deine@email.de]" className="text-accent">[deine@email.de]</a>
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-stone-900">6. Kontaktformular & E-Mail</h2>
          <p>
            E-Mails werden über <strong>Resend</strong> versendet. Dabei werden E-Mail-Adressen
            vorübergehend verarbeitet, um den Versand zu ermöglichen.
          </p>
        </section>

        <p className="border-t border-stone-200 pt-4 text-xs text-stone-400">
          Stand: Juni 2026
        </p>
      </div>
    </div>
  );
}
