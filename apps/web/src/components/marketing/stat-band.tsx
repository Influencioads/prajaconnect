import { STATS } from './content';
import { Reveal } from './reveal';

export function StatBand() {
  return (
    <section className="relative -mt-px border-y border-white/10 bg-navy-900 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-4 sm:px-6 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <Reveal
            key={stat.label}
            delay={i * 80}
            className="flex flex-col items-center gap-2 px-4 py-8 text-center sm:py-10"
          >
            <stat.icon className="h-5 w-5 text-gold" />
            <p className="font-display text-3xl font-bold text-white sm:text-4xl">{stat.value}</p>
            <p className="text-sm text-white/55">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
