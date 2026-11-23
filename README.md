# Solace frontend

Open this folder in VS Code (File → Open Folder), then right-click `index.html`
→ **Open with Live Server** (or just double-click it). No Flask needed.

## Folders
- `index.html`          Links to every page
- `pages/`              Plain HTML pages (open directly): login, register, client-settings, therapist-settings
- `static/css|js|img`   auth.css, settings.css, auth.js, settings.js, logos
- `flask-templates/`    Jinja versions of login/register + auth-base.html for when routing is ready
                        (copy into frontend-Solace/templates; links are `#` placeholders)

## Names are prefixed to avoid clashes with the team's files
CSS scoped to `.auth-body` / `.settings-body`, variables `--auth-*` / `--st-*`.
