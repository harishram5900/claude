import { GlobeLazy } from "@/components/three/GlobeLazy";
import { Counter } from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";

/** Interactive 3D globe: Aurora, IL → the world. */
export function Reach() {
  return (
    <section aria-labelledby="reach-heading" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-page items-center gap-10 px-4 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1fr_1.1fr] lg:px-12">
        <Reveal>
          <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-accent">
            <span className="h-px w-8 bg-accent/60" />
            Reach
          </p>
          <h2 id="reach-heading" className="mt-6 font-display text-display-md font-bold text-fg">
            Built in Aurora, IL.
            <span className="block text-gradient">Used in 70+ countries.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            My products have reached <strong className="font-semibold text-fg">50,000+ users</strong> around the world —
            from a bedroom project with no signup to a 23-person team.
          </p>
          <dl className="mt-10 flex gap-10">
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-muted">Countries</dt>
              <dd className="font-display text-5xl font-bold text-gradient">
                <Counter value={70} suffix="+" />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-muted">Users</dt>
              <dd className="font-display text-5xl font-bold text-gradient">
                <Counter value={50000} suffix="+" />
              </dd>
            </div>
          </dl>
          <p className="mt-8 text-xs text-muted">Drag the globe to spin it. Arcs are illustrative.</p>
        </Reveal>
        <div className="relative mx-auto w-full max-w-[36rem]">
          <GlobeLazy />
        </div>
      </div>
    </section>
  );
}
