import { z } from "zod";

const idSchema = z
  .string()
  .min(2)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const ManifestSourceSchema = z
  .object({
    id: idSchema,
    title: z.string().min(3),
    url: z.string().url(),
    publisher: z.string().min(2),
    license: z.string().min(2),
    retrievedAt: z.string().date(),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    allowedUsage: z.enum(["facts-and-paraphrase", "public-domain-text", "metadata-only"]),
    normalizedExcerpt: z.string().min(40).max(8_000),
    attributionText: z.string().min(12),
  })
  .strict();

export const SourceManifestSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    lessonId: idSchema,
    locale: z.literal("en"),
    reviewedAt: z.string().date(),
    sources: z.array(ManifestSourceSchema).min(2).max(8),
  })
  .strict()
  .superRefine((manifest, context) => {
    if (new Set(manifest.sources.map((source) => source.id)).size !== manifest.sources.length) {
      context.addIssue({
        code: "custom",
        path: ["sources"],
        message: "Source IDs must be unique.",
      });
    }
  });

export type SourceManifest = z.infer<typeof SourceManifestSchema>;
