import Image from 'next/image';

const PARTNERS = [
  { name: 'HEC Paris German Society', logo: '/logos/hec-german-society.png', width: 220 },
];

export default function PartnersBanner() {
  return (
    <section className="border-y border-stone-100 bg-white py-8 px-4">
      <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-stone-400">
        Partnerorganisationen
      </p>
      <div className="flex items-center justify-center gap-12">
        {PARTNERS.map((p) => (
          <div key={p.name} className="opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0">
            <Image
              src={p.logo}
              alt={p.name}
              width={p.width}
              height={60}
              className="h-10 w-auto object-contain"
              unoptimized
            />
          </div>
        ))}
      </div>
    </section>
  );
}
