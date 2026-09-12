import { z } from 'astro/zod';
import { CATEGORIES, DATASET_IDS } from './taxonomy';

const url = z.url();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export const projectSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'id must be a lowercase slug'),
    name: z.string().min(2),
    url,
    repoUrl: url.optional(),
    category: z.enum(CATEGORIES),
    tags: z.array(z.string().min(1)).default([]),
    datasets: z.array(z.enum(DATASET_IDS)).default([]),
    org: z.string().min(1),
    region: z.string().min(1).optional(),
    license: z.string().min(1).optional(),
    language: z.string().min(1).optional(),
    date: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'expected YYYY, YYYY-MM or YYYY-MM-DD'),
    addedAt: isoDate,
    stars: z.number().int().nonnegative().optional(),
    starsUpdatedAt: isoDate.optional(),
    status: z.enum(['active', 'archived']).default('active'),
    description_en: z.string().min(60).max(600),
    description_ja: z.string().min(40).max(600),
    thumbnail: z.string().startsWith('/thumbs/').optional(),
    featured: z.boolean().default(false),
    sourceRefs: z.array(url).min(1),
  })
  .strict();

export type Project = z.infer<typeof projectSchema>;
export type ProjectInput = z.input<typeof projectSchema>;
