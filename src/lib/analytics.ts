export type AnalyticsEnv = Partial<Record<'PUBLIC_VERCEL_ANALYTICS' | 'PUBLIC_GA_MEASUREMENT_ID', string | undefined>>;

export interface AnalyticsConfig {
  /** Vercel Web Analytics: cookie-less page views, served from /_vercel/insights/script.js. */
  vercel: boolean;
  /** Google Analytics 4 measurement id (G-XXXXXXX), only when explicitly configured. */
  gaId: string | null;
}

const truthy = (v: string | undefined) => /^(1|true|yes|on)$/i.test((v ?? '').trim());

export function analyticsConfig(env: AnalyticsEnv): AnalyticsConfig {
  const ga = (env.PUBLIC_GA_MEASUREMENT_ID ?? '').trim();
  return {
    vercel: truthy(env.PUBLIC_VERCEL_ANALYTICS),
    gaId: /^G-[A-Z0-9]{4,}$/.test(ga) ? ga : null,
  };
}

export const VERCEL_INSIGHTS_SRC = '/_vercel/insights/script.js';
