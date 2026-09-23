export function Footer() {
  return (
    <footer className="border-t border-line/10">
      <div className="mx-auto flex max-w-page flex-col gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <p>© {new Date().getFullYear()} Harish Ramasubramanian · Aurora, IL</p>
        <a href="#top" className="text-fg/80 transition-colors hover:text-accent">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
