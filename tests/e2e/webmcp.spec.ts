import { expect, test, type Page } from '@playwright/test';

/**
 * WebMCP has no headless implementation, so we stand in for the browser's agent:
 * stub `document.modelContext` before any page script runs, collect what the page
 * registers, and drive the tools the way an agent would.
 */
const STUB = () => {
  const registered: unknown[] = [];
  Object.defineProperty(document, 'modelContext', {
    configurable: true,
    value: {
      registerTool(tool: unknown) {
        registered.push(tool);
        return Promise.resolve();
      },
    },
  });
  (window as unknown as { __tools: unknown[] }).__tools = registered;
};

type Tool = { name: string; description: string; inputSchema: Record<string, unknown> };

async function openWithStub(page: Page, path: string): Promise<Tool[]> {
  await page.addInitScript(STUB);
  await page.goto(path);
  await page.waitForFunction(() => (window as unknown as { __tools: unknown[] }).__tools?.length === 4);
  return page.evaluate(() =>
    (window as unknown as { __tools: Tool[] }).__tools.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    })),
  );
}

const call = (page: Page, name: string, input: Record<string, unknown>) =>
  page.evaluate(
    ([toolName, args]) => {
      const tools = (window as unknown as { __tools: { name: string; execute: (i: unknown) => Promise<unknown> }[] }).__tools;
      const tool = tools.find((t) => t.name === toolName);
      if (!tool) throw new Error(`no tool named ${toolName}`);
      return tool.execute(args);
    },
    [name, input] as const,
  );

test('AC-14-6 the page registers its four tools for an agent-enabled browser', async ({ page }) => {
  const tools = await openWithStub(page, '/');
  expect(tools.map((t) => t.name)).toEqual([
    'search-projects',
    'get-project',
    'list-categories',
    'list-datasets',
  ]);
  for (const tool of tools) expect(tool.inputSchema.additionalProperties).toBe(false);
});

test('AC-14-6 search-projects filters against the real index', async ({ page, baseURL }) => {
  await openWithStub(page, '/');
  const index = await (await fetch(new URL('/search-index.json', baseURL))).json();
  const expected = (index as { category: string }[]).filter((i) => i.category === 'connectome').length;
  expect(expected).toBeGreaterThan(0);

  const out = (await call(page, 'search-projects', { category: 'connectome' })) as {
    ok: boolean;
    total: number;
    results: { id: string; category: string; page: string }[];
  };
  expect(out.ok).toBe(true);
  expect(out.total).toBe(expected);
  for (const r of out.results) {
    expect(r.category).toBe('connectome');
    expect(r.page.startsWith('/projects/')).toBe(true);
  }
});

test('AC-14-6 results follow the locale of the page the agent is on', async ({ page }) => {
  await openWithStub(page, '/ja/');
  const out = (await call(page, 'get-project', { id: 'flybody' })) as {
    found: boolean;
    project: { page: string; page_en: string; page_ja: string; description: string };
  };
  expect(out.found).toBe(true);
  expect(out.project.page).toBe('/ja/projects/flybody');
  expect(out.project.page_en).toBe('/projects/flybody');
  // The Japanese description, not the English one.
  expect(out.project.description).toMatch(/[ぁ-んァ-ヶ一-龯]/);
});

test('AC-14-6 an unknown id is reported, not thrown', async ({ page }) => {
  await openWithStub(page, '/');
  const out = (await call(page, 'get-project', { id: 'definitely-not-a-project' })) as {
    ok: boolean;
    found: boolean;
  };
  expect(out.ok).toBe(true);
  expect(out.found).toBe(false);
});

test('AC-14-5 a browser without WebMCP is unaffected', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/projects');
  await expect(page.locator('[data-webmcp]')).toHaveCount(1);
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});
