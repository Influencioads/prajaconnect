import { Check, Smartphone, Wifi } from 'lucide-react';
import { Reveal } from './reveal';

const SCREENS = ['Dashboard', 'Directory', 'Grievances', 'Events'];
const POINTS = [
  'Login, dashboard and directory in your pocket',
  'Log and track grievances from the field',
  'Door-to-door surveys that work offline and sync later',
  'Event QR check-in and push notifications',
];

export function MobileSection() {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-gold/10 blur-[100px]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">In the field</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            A mobile app built for cadre on the ground
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
            The Expo app keeps your karyakartas productive between booths — even where the network
            drops. Everything syncs back the moment they reconnect.
          </p>
          <ul className="mt-7 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-sm text-white/80">{point}</span>
              </li>
            ))}
          </ul>
          <p className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80">
            <Wifi className="h-3.5 w-3.5 text-gold" />
            Offline-first sync queue
          </p>
        </Reveal>

        <Reveal delay={120} className="flex justify-center lg:justify-end">
          <div className="flex items-end gap-4">
            {/* Two stylised phone frames */}
            {[0, 1].map((idx) => (
              <div
                key={idx}
                className={
                  idx === 0
                    ? 'relative h-[22rem] w-44 rounded-[2rem] border-4 border-white/15 bg-navy-900 p-3 shadow-2xl sm:h-[26rem] sm:w-52'
                    : 'relative hidden h-[18rem] w-40 translate-y-6 rounded-[2rem] border-4 border-white/10 bg-navy-900 p-3 shadow-xl sm:block'
                }
              >
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/15" />
                <div className="flex items-center gap-2 rounded-xl bg-gold px-3 py-2 text-navy">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-xs font-bold">Praja Connect</span>
                </div>
                <div className="mt-3 space-y-2">
                  {SCREENS.map((s) => (
                    <div
                      key={s}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
                    >
                      <span className="text-[11px] text-white/70">{s}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-gold/70" />
                    </div>
                  ))}
                  <div className="mt-3 flex h-16 items-end gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] p-2">
                    {[40, 70, 55, 85, 60].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gold/70"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
