import Image from 'next/image';

const PARTNERS = [
  { name: 'HEC Paris German Society', logo: '/logos/hec-german-society.png', width: 220 },
];

// Quadruple to fill wide screens and make the scroll seamless (we translate -50%)
const TRACK = [...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS];

export default function PartnersBanner() {
  return (
    <section className="border-y border-stone-100 bg-white py-8 px-0">
      <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-stone-400">
        Partnerorganisationen
      </p>
      <div className="marquee-pause overflow-hidden">
        <div className="animate-marquee flex items-center gap-16 whitespace-nowrap">
          {TRACK.map((p, i) => (
            <div key={i} className="shrink-0 flex items-center justify-center opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0">
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
      </div>
    </section>
  );
}
