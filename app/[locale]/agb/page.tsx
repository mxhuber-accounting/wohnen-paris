export async function generateMetadata() {
  return { title: 'AGB — Wohnen Abroad' };
}

export default function AgbPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-serif text-3xl font-semibold text-stone-900">
        Allgemeine Nutzungsbedingungen
      </h1>
      <div className="space-y-6 text-sm leading-relaxed text-stone-700">
        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-stone-900">§ 1 Geltungsbereich</h2>
          <p>
            Diese Nutzungsbedingungen gelten für die Nutzung der Plattform Wohnen Abroad
            (wohnen-abroad.com). Betreiber ist [Dein Name], [Adresse].
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-stone-900">§ 2 Leistungsbeschreibung</h2>
          <p>
            Wohnen Abroad ist eine kostenlose Plattform zur Vermittlung von Wohnungsanzeigen für
            deutschsprachige Nutzer in Paris und London. Die Plattform stellt lediglich die technische
            Infrastruktur zur Verfügung; Mietverträge kommen direkt zwischen Nutzern zustande.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-stone-900">§ 3 Registrierung</h2>
          <p>
            Für die Nutzung bestimmter Funktionen (Anzeige aufgeben, Nachrichten senden) ist eine
            Registrierung erforderlich. Die Anmeldung erfolgt über einen passwortlosen Magic Link
            per E-Mail. Die Angabe korrekter E-Mail-Adressen ist Pflicht.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-stone-900">§ 4 Pflichten der Nutzer</h2>
          <p>Nutzer verpflichten sich:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>Nur wahrheitsgemäße Angaben in Anzeigen zu machen</li>
            <li>Keine gefälschten oder irreführenden Anzeigen einzustellen</li>
            <li>Keine rechtswidrigen Inhalte zu veröffentlichen</li>
            <li>Die Plattform nicht für Spam oder Betrug zu missbrauchen</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-stone-900">§ 5 Haftungsausschluss</h2>
          <p>
            Der Betreiber übernimmt keine Haftung für die Richtigkeit, Vollständigkeit oder
            Aktualität der von Nutzern eingestellten Inhalte. Der Betreiber ist nicht Partei des
            Mietverhältnisses und übernimmt keine Gewähr für den Abschluss oder die Durchführung
            von Mietverträgen.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-stone-900">§ 6 Kündigung / Sperrung</h2>
          <p>
            Der Betreiber behält sich das Recht vor, Nutzerkonten bei Verstößen gegen diese
            Nutzungsbedingungen ohne Vorankündigung zu sperren oder zu löschen.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-stone-900">§ 7 Anwendbares Recht</h2>
          <p>
            Es gilt deutsches Recht. Gerichtsstand ist [dein Wohnort], soweit gesetzlich zulässig.
          </p>
        </section>

        <p className="border-t border-stone-200 pt-4 text-xs text-stone-400">
          Stand: Juni 2026
        </p>
      </div>
    </div>
  );
}
