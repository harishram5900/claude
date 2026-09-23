import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Reach } from "@/components/sections/Reach";
import { Ventures } from "@/components/sections/Ventures";
import { Awards } from "@/components/sections/Awards";
import { Experience } from "@/components/sections/Experience";
import { Skills } from "@/components/sections/Skills";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Reach />
        <Ventures />
        <Awards />
        <Experience />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
