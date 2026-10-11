# Security Policy

## Reporting a vulnerability

Please do not report exploitable vulnerabilities in public issues. Contact the repository owner privately through GitHub's security reporting feature if it is enabled for this repository. Include the affected area, impact, and reproducible steps. Avoid including real user data or live credentials.

## Secret handling

- Never commit API keys, access tokens, passwords, bank credentials, UPI PINs, OTPs, private keys, or production data.
- Keep privileged credentials on trusted server-side integrations; do not embed secrets in browser-delivered code or `VITE_*` variables.
- Use environment-specific, least-privilege credentials and rotate any secret that may have been exposed.
- Review imports and third-party integrations before granting access.
- Report accidentally committed secrets promptly; deleting a file from the latest commit does not invalidate the exposed credential.

## Financial data

Runway's forecasts are planning estimates, not verified bank balances or financial advice. Test with synthetic data and do not put real account identifiers or transaction exports into bug reports.
