import { describe, expect, it } from 'vitest';
import { analyticsConfig } from '../../src/lib/analytics';

describe('R-13 analytics', () => {
  it('AC-13-1 Vercel analytics is off unless PUBLIC_VERCEL_ANALYTICS is truthy', () => {
    expect(analyticsConfig({}).vercel).toBe(false);
    expect(analyticsConfig({ PUBLIC_VERCEL_ANALYTICS: '' }).vercel).toBe(false);
    expect(analyticsConfig({ PUBLIC_VERCEL_ANALYTICS: '0' }).vercel).toBe(false);
    expect(analyticsConfig({ PUBLIC_VERCEL_ANALYTICS: '1' }).vercel).toBe(true);
    expect(analyticsConfig({ PUBLIC_VERCEL_ANALYTICS: 'true' }).vercel).toBe(true);
  });

  it('AC-13-1b GA id must look like a GA4 measurement id', () => {
    expect(analyticsConfig({}).gaId).toBeNull();
    expect(analyticsConfig({ PUBLIC_GA_MEASUREMENT_ID: 'UA-1234-1' }).gaId).toBeNull();
    expect(analyticsConfig({ PUBLIC_GA_MEASUREMENT_ID: 'G-ABC123XYZ' }).gaId).toBe('G-ABC123XYZ');
    expect(analyticsConfig({ PUBLIC_GA_MEASUREMENT_ID: ' G-ABC123XYZ ' }).gaId).toBe('G-ABC123XYZ');
  });
});
