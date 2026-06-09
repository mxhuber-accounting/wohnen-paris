import Image from 'next/image';

const PARTNERS = [
  { name: 'HEC Paris German Society', logo: '/logos/hec-german-society.png', width: 220 },
];

export default function PartnersBanner() {
  return (
    <section className="border-b border-border bg-background px-4 py-8">
      <p className="mb-5 text-center text-xs font-medium uppercase tracking-widest text-muted">
        Partnerorganisationen
      </p>
      <div className="flex items-center justify-center gap-12">
        {PARTNERS.map((p) => (
          <div key={p.name} className="opacity-50 grayscale transition-all hover:opacity-80 hover:grayscale-0">
            <Image
              src={p.logo}
              alt={p.name}
              width={p.width}
              height={60}
              className="h-8 w-auto object-contain"
              unoptimized
            />
          </div>
        ))}
      </div>
    </section>
  );
}
