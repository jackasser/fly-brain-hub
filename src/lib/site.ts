/** Site-level settings read from public env vars, with safe fallbacks. */
export const GITHUB_REPO: string = import.meta.env.PUBLIC_GITHUB_REPO || 'OWNER/fly-brain-hub';
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;
export const SUBMIT_ISSUE_URL = `${GITHUB_URL}/issues/new?template=submit-project.yml`;
export const CONTACT_EMAIL: string | undefined = import.meta.env.PUBLIC_CONTACT_EMAIL || undefined;
