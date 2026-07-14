import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SourceList } from "@/components/learning/SourceList";
import { BrandMark } from "@/components/shared/BrandMark";
import { getLessonPack } from "@/lib/lessons/repository";

type PageProps = { params: Promise<{ lessonId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lesson = getLessonPack((await params).lessonId);
  return { title: lesson ? `${lesson.title} Sources` : "Lesson sources" };
}

export default async function SourcesPage({ params }: PageProps) {
  const lesson = getLessonPack((await params).lessonId);
  if (!lesson) notFound();
  return (
    <main className="site-shell sources-page">
      <nav className="hero-nav glass-material" aria-label="Source page navigation">
        <BrandMark />
        <Link className="secondary-action pressable" href={`/learn/${lesson.slug}`}>
          Return to lesson
        </Link>
      </nav>
      <header className="source-header">
        <p className="eyebrow">Evidence and attribution</p>
        <h1 className="display-title">{lesson.title}</h1>
        <p className="body-copy">
          These reviewed sources support characters, relationships, missions, and prepared
          learning checks in this lesson.
        </p>
      </header>
      <SourceList lesson={lesson} />
    </main>
  );
}
