// Centralized branding so a second deployment (e.g. for a different company)
// only needs to set env vars — no code changes required.
//
// Set these in .env (and in your hosting provider's env var settings):
//   NEXT_PUBLIC_COMPANY_NAME="Acme Corp"
//   NEXT_PUBLIC_PORTAL_LABEL="Project Management Portal"
export const BRANDING = {
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'KutkiTech Pvt.Ltd',
  portalLabel: process.env.NEXT_PUBLIC_PORTAL_LABEL || 'Project Management Portal',
}
