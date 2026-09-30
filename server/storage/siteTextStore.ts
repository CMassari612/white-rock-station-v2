import { readDoc, writeDoc } from './db';

const KEY = 'siteText';

export type SiteText = Record<string, string>;

// Overrides for the site's fixed marketing copy, keyed by a stable id assigned
// in the React components. Empty by default — pages fall back to their built-in
// text until an admin edits it on the page.
export async function getSiteText(): Promise<SiteText> {
  try {
    return (await readDoc<SiteText>(KEY)) || {};
  } catch (err) {
    console.error('[siteText] read failed:', err);
    return {};
  }
}

export async function saveSiteText(map: SiteText): Promise<void> {
  await writeDoc<SiteText>(KEY, map);
}

// Merge a batch of edits over the existing overrides. Empty strings are treated
// as "reset to default" (the key is removed).
export async function applySiteTextEdits(edits: SiteText): Promise<SiteText> {
  const current = await getSiteText();
  for (const [id, value] of Object.entries(edits)) {
    if (typeof value !== 'string') continue;
    if (value.trim() === '') delete current[id];
    else current[id] = value;
  }
  await saveSiteText(current);
  return current;
}
