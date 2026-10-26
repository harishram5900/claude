import { Ollie } from "@/components/Ollie";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <Ollie mood="think" size={150} />
      <div className="mt-4 font-display text-6xl font-semibold">404</div>
      <p className="mt-2 text-muted">Ollie looked everywhere. This page was waitlisted.</p>
      <ButtonLink href="/" className="mt-6">Back home</ButtonLink>
    </div>
  );
}
