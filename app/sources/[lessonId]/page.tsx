import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SourceList } from "@/components/learning/SourceList";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { ExhibitionHeader } from "@/components/navigation/ExhibitionHeader";
import { createLandingLesson } from "@/lib/landing/lesson-view-model";
import { getAllLessonPacks, getLessonPack } from "@/lib/lessons/repository";
import type { LessonPack } from "@/lib/lessons/schema";

type PageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ returnTo?: string }>;
};

function resolveReturnHref(lesson: LessonPack, requestedHref?: string) {
  const lessonHref = `/learn/${lesson.slug}`;
  if (!requestedHref) return lessonHref;

  try {
    const target = new URL(requestedHref, "https://ai-character-galaxy.local");
    if (target.origin !== "https://ai-character-galaxy.local" || target.pathname !== lessonHref) {
      return lessonHref;
    }

    const focus = target.searchParams.get("focus");
    return focus && lesson.characters.some((character) => character.id === focus)
      ? `${lessonHref}?focus=${encodeURIComponent(focus)}`
      : lessonHref;
  } catch {
    return lessonHref;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lesson = getLessonPack((await params).lessonId);
  return { title: lesson ? `${lesson.title} Sources` : "Lesson sources" };
}

export default async function SourcesPage({ params, searchParams }: PageProps) {
  const lesson = getLessonPack((await params).lessonId);
  if (!lesson) notFound();
  const lessons = getAllLessonPacks().map(createLandingLesson);
  const returnHref = resolveReturnHref(lesson, (await searchParams).returnTo);

  return (
    <main className={`sources-page sources-page--${lesson.kind}`}>
      <SmoothScrollProvider />
      <ExhibitionHeader
        lessons={lessons}
        currentLessonId={lesson.id}
        theme="paper"
        actions={(
          <Link className="source-return-action" href={returnHref}>
            <span className="source-return-long">Return to lesson</span>
            <span className="source-return-short">Lesson</span>
            <i aria-hidden="true">↙</i>
          </Link>
        )}
      />
      <header className="source-header">
        <p className="editorial-kicker">Evidence archive · Reviewed attribution</p>
        <h1>{lesson.title}</h1>
        <div className="source-header-aside">
          <p>
            These reviewed sources support characters, relationships, missions, and prepared
            learning checks in this lesson.
          </p>
          <dl>
            <div><dt>Course</dt><dd>{lesson.kind}</dd></div>
            <div><dt>Sources</dt><dd>{String(lesson.sources.length).padStart(2, "0")}</dd></div>
          </dl>
        </div>
      </header>
      <section className="source-register" aria-labelledby="source-register-title">
        <div className="source-register-heading">
          <p>01 · Evidence register</p>
          <h2 id="source-register-title">Source material</h2>
          <span>Open every record to review its original publisher and attribution terms.</span>
        </div>
        <SourceList lesson={lesson} />
      </section>
    </main>
  );
}
