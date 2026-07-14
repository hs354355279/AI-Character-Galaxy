import { Hero } from "@/components/home/Hero";
import { LessonCard } from "@/components/home/LessonCard";
import { getAllLessonPacks } from "@/lib/lessons/repository";

export default function HomePage() {
  const lessons = getAllLessonPacks();
  return (
    <main className="site-shell home-page">
      <Hero />
      <section id="official-lessons" className="lesson-library" aria-labelledby="lesson-library-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Two complete learning journeys</p>
            <h2 id="lesson-library-title" className="section-title">
              Choose your first constellation.
            </h2>
          </div>
          <p className="body-copy">No account. No open-ended chat. Every relationship connects to evidence.</p>
        </div>
        <div className="lesson-grid">
          {lessons.map((lesson, index) => (
            <LessonCard key={lesson.id} lesson={lesson} number={index + 1} />
          ))}
        </div>
      </section>
      <section className="trust-strip" aria-label="Learning safeguards">
        <div><strong>Evidence first</strong><span>Every official relationship includes a source.</span></div>
        <div><strong>Works offline</strong><span>Prepared missions and checks stay available.</span></div>
        <div><strong>Private by design</strong><span>Progress stays in this browser session.</span></div>
      </section>
      <footer className="home-footer">
        <BrandLine />
        <p>Built for OpenAI Build Week · Education</p>
      </footer>
    </main>
  );
}

function BrandLine() {
  return <span>Every person has a universe of relationships.</span>;
}
