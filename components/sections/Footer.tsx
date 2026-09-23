export function Footer() {
  return (
    <footer className="border-t border-cream/10 bg-black">
      <div className="mx-auto flex max-w-page flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <p className="font-display text-lg font-bold tracking-[0.12em] text-cream">
          HARISH R<span className="text-gold-light">.</span>
        </p>
        <p className="text-sm text-gray-light">© {new Date().getFullYear()} Harish Ramasubramanian. Built in public.</p>
        <a href="#top" className="text-sm text-cream/80 transition-colors hover:text-gold-light">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
