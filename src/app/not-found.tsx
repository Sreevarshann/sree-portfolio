import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[80svh] flex-col justify-center pt-24">
      <p className="eyebrow">404 · Off the map</p>
      <h1 className="display mt-6 text-[clamp(3rem,10vw,8rem)]">
        Nothing at these <span className="serif-accent text-accent-fg">coordinates.</span>
      </h1>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">Back home <span className="arrow" aria-hidden="true">→</span></Link>
        <Link href="/projects" className="btn btn-ghost">Projects</Link>
      </div>
    </section>
  );
}
