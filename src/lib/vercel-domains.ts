/**
 * @fileOverview Server-side utility for managing custom domains via the Vercel API.
 * Orchestrates domain attachment, verification, and DNS diagnostics.
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID; // Optional, required if using a Vercel Team

const getHeaders = () => {
  if (!VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN is not configured in environment variables.');
  }
  return {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  };
};

const getBaseUrl = (path: string) => {
  const url = new URL(`https://api.vercel.com${path}`);
  if (TEAM_ID) {
    url.searchParams.append('teamId', TEAM_ID);
  }
  return url.toString();
};

/**
 * Attaches a domain to the Vercel project.
 */
export async function addDomainToVercel(domain: string) {
  if (!PROJECT_ID) throw new Error('VERCEL_PROJECT_ID is missing.');

  const response = await fetch(getBaseUrl(`/v9/projects/${PROJECT_ID}/domains`), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name: domain.toLowerCase() }),
  });

  const data = await response.json();
  if (!response.ok) {
    // If domain already exists, we treat it as success but return the existing data
    if (data.error?.code === 'domain_already_exists') return data;
    throw new Error(data.error?.message || 'Failed to add domain to Vercel');
  }

  return data;
}

/**
 * Checks if the DNS for a domain is correctly configured for Vercel.
 */
export async function getDomainConfig(domain: string) {
  const response = await fetch(getBaseUrl(`/v6/domains/${domain}/config`), {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch domain config from Vercel');
  }

  return data;
}

/**
 * Triggers a verification check for a domain attached to the project.
 */
export async function verifyDomain(domain: string) {
  if (!PROJECT_ID) throw new Error('VERCEL_PROJECT_ID is missing.');

  const response = await fetch(getBaseUrl(`/v9/projects/${PROJECT_ID}/domains/${domain}/verify`), {
    method: 'POST',
    headers: getHeaders(),
  });

  const data = await response.json();
  // Verification might fail if DNS isn't ready yet, we return the status
  return data;
}

/**
 * Fetches the project-specific domain data including verification status.
 */
export async function getProjectDomain(domain: string) {
  if (!PROJECT_ID) throw new Error('VERCEL_PROJECT_ID is missing.');

  const response = await fetch(getBaseUrl(`/v9/projects/${PROJECT_ID}/domains/${domain}`), {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch project domain data');
  }

  return data;
}
