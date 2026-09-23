import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { LevelUp } from "@/components/sections/LevelUp";
import { Ventures } from "@/components/sections/Ventures";
import { Recognition } from "@/components/sections/Recognition";
import { Leadership } from "@/components/sections/Leadership";
import { BuildingInPublic } from "@/components/sections/BuildingInPublic";
import { Journey } from "@/components/sections/Journey";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

/**
 * Single scrolling page. Surface rhythm:
 *   dark (hero) → cream (about) → dark (Level Up) → charcoal (ventures)
 *   → dark (recognition) → cream (leadership) → dark (social, journey, contact)
 */
export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <LevelUp />
        <Ventures />
        <Recognition />
        <Leadership />
        <BuildingInPublic />
        <Journey />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
