import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <div className="font-display text-6xl font-semibold">404</div>
      <p className="mt-2 text-muted">This page was waitlisted.</p>
      <ButtonLink href="/" className="mt-6">Back home</ButtonLink>
    </div>
  );
}
