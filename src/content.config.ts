import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { projectSchema } from './lib/schema';

export const collections = {
  projects: defineCollection({
    loader: file('src/data/projects.json'),
    schema: projectSchema,
  }),
};
