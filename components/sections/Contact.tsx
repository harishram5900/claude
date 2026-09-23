"use client";

import { useState } from "react";
import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { isPlaceholder, links } from "@/lib/links";

/** Closing CTA + a contact form that opens a pre-filled email (no backend needed). */
export function Contact() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Hello from ${name || "your portfolio"}`);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${links.email}?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" aria-labelledby="contact-heading" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-1/2 left-1/2 h-[50rem] w-[50rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/0.18),transparent_60%)] blur-3xl" />
      <div className="relative mx-auto grid max-w-page gap-14 px-4 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:px-12">
        <Reveal>
          <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-accent">
            <span className="font-display text-sm tracking-normal">06</span>
            <span className="h-px w-8 bg-accent/60" />
            Contact
          </p>
          <h2 id="contact-heading" className="mt-6 font-display text-display-md font-bold text-fg">
            Let&apos;s build something <span className="block italic text-gradient">that matters.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg text-muted">
            Investors, mentors, collaborators, or founders who want to trade notes — my inbox is open.
          </p>
          <Magnetic strength={0.15}>
            <a
              href={`mailto:${links.email}`}
              className="mt-8 inline-block break-all font-display text-2xl font-semibold text-fg underline decoration-accent/50 underline-offset-8 transition-colors hover:text-accent sm:text-3xl"
            >
              {links.email}
            </a>
          </Magnetic>
          <div className="mt-8 flex gap-3">
            <SocialIcon kind="linkedin" href={links.linkedin} />
            <SocialIcon kind="instagram" href={links.instagram} />
            {!isPlaceholder(links.youtube) && <SocialIcon kind="youtube" href={links.youtube} />}
          </div>
          {!isPlaceholder(links.resume) && (
            <a href={links.resume} className="mt-6 inline-block text-sm font-medium text-accent underline underline-offset-4">
              Download résumé ↓
            </a>
          )}
        </Reveal>

        <Reveal>
          <form onSubmit={onSubmit} className="rounded-[2rem] border border-line/10 bg-surface p-6 sm:p-9">
            <label htmlFor="c-name" className="text-sm font-medium text-fg">
              Your name
            </label>
            <input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="mt-2 w-full rounded-xl border border-line/15 bg-bg px-4 py-3 text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none"
              placeholder="Jane Founder"
            />
            <label htmlFor="c-msg" className="mt-6 block text-sm font-medium text-fg">
              Message
            </label>
            <textarea
              id="c-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="mt-2 w-full resize-none rounded-xl border border-line/15 bg-bg px-4 py-3 text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none"
              placeholder="What are you building?"
            />
            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-accent px-6 py-4 text-sm font-semibold text-on-accent transition-transform hover:scale-[1.01]"
            >
              Send message →
            </button>
            <p className="mt-3 text-center text-xs text-muted">Opens your email app with the message filled in.</p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
