# SAIRA: Pre-Public Checklist

Before switching the repository to public, work through every item below. Check each one off and commit the result.

---

## 1. Secrets Scan — Current Working Tree

Run these commands from the repo root. They scan for common secret patterns in every tracked file.

```bash
# Scan for raw private key material
git grep -rn "PRIVATE KEY\|private_key\|client_secret\|service_account" -- . ':(exclude)node_modules' ':(exclude)pnpm-lock.yaml'

# Scan for Firebase service-account JSON structure
git grep -rn '"type": "service_account"' -- . ':(exclude)node_modules'

# Scan for API keys that look like Google keys (AIza...)
git grep -rn 'AIza[0-9A-Za-z_-]\{35\}' -- . ':(exclude)node_modules'

# Scan for .env variable assignments with real values (not placeholders)
git grep -rn 'VITE_FIREBASE_API_KEY=[^$\n]\+' -- . ':(exclude).env.example' ':(exclude)node_modules'

# Verify .env is in .gitignore and NOT tracked
git ls-files .env
# Expected output: (empty — .env must not be tracked)

# Extra check: scan for any file named *.json that might contain a private key
git ls-files '*.json' | xargs -I{} grep -l '"private_key"' {} 2>/dev/null
```

**Expected result:** No output from any of the above (other than the empty-line for `git ls-files .env`).

---

## 2. Secrets Scan — Full Git History

The working tree is clean, but commits may have accidentally included secrets before they were removed. Run the following to scan the entire commit history:

```bash
# Install trufflehog (if not installed)
# macOS: brew install trufflehog
# Linux/CI: curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh

# Scan the full repo history
trufflehog git file://. --only-verified

# Alternative without trufflehog: use git-secrets
# brew install git-secrets
# git secrets --scan-history
```

Or scan manually for Firebase API keys across all commits:

```bash
# List every commit SHA that added a line matching AIza...
git log --all --oneline | awk '{print $1}' | xargs -I{} git grep -l 'AIza' {} 2>/dev/null | sort -u
```

If a secret is found in history, rewrite history with `git filter-repo` and rotate the key immediately:
```bash
pip install git-filter-repo
git filter-repo --path .env --invert-paths
# Then force-push and rotate the exposed key in Firebase console
```

---

## 3. Files to Review for Personal Information

Check the following for names, email addresses, phone numbers, or other personal data:

| File | What to look for |
|---|---|
| `AGENTS.md` | Any personal details added during development |
| `docs/*.md` | Personal names in examples or progress notes |
| `src/data/*.seed.json` | Names used as placeholder data |
| `firestore.rules` | Any hard-coded UIDs |
| `.firebase/hosting.*.cache` | Cached hosting data (safe to delete/ignore) |
| `src/lib/__tests__/*.test.ts` | Test UIDs like `'alice'`, `'bob'` — these are fine; real UIDs are not |
| `public/` images | EXIF metadata in any PNG/JPG (run `exiftool -all= public/**` to strip) |
| `package.json` | Author field, repository URL |

Run a broad name search (substitute your real name):
```bash
git grep -rn "YourRealName\|yourpersonalemail@" -- . ':(exclude)node_modules'
```

---

## 4. Licence Checks

### 4a. Landing Video
- **Source:** CloudFront URL in `VITE_LANDING_VIDEO_URL`
- **Action needed:** Confirm the video licence allows public redistribution. If not, replace with a self-created clip or a CC0/public-domain video before making the repo public.

### 4b. Google Fonts
- **Fonts used:** Instrument Serif, Inter, JetBrains Mono
- **Licence:** All three are released under the [SIL Open Font Licence 1.1](https://openfontlicense.org/), which permits free use, embedding, and redistribution. ✅ No action needed.

### 4c. Icons and Images
- **Brand icons** (`public/icons/`): self-created or commissioned — confirm you own the rights.
- **Coach artwork** (`public/coach/`): confirm licence for any art used. If stock images, add attribution or replace.

### 4d. DSA Content (Quotes, Coach Lines)
- **Quotes** (`src/data/quotes.seed.json`): Review each quote for attribution. Public-domain or self-written quotes need no licence. Attributed quotes to living authors may need permission.
- **Coach lines** (`src/data/avatar-lines.seed.json`): Entirely self-written — no issue.
- **DSA problem titles** (`src/data/sheet.seed.json`): These are problem names/topics (facts, not copyrightable expression). ✅ Safe.

### 4e. NPM Packages
All production dependencies use permissive open-source licences (MIT, Apache-2.0, BSD). Run a quick audit:
```bash
pnpm licenses list --prod 2>/dev/null | grep -v MIT | grep -v ISC | grep -v Apache | grep -v BSD
```
Review any non-standard licences before going public.

---

## 5. Steps to Switch the Repository to Public

Only do this after every item above is cleared.

1. **Rotate any key that was ever committed** — even if you removed it from history. Go to Firebase console → Project settings → your API key → regenerate.

2. **Update Firebase Authorized Domains** — make sure `<project>.web.app` and `<project>.firebaseapp.com` are listed. Remove `localhost` if you want prod-only.

3. **Review Firestore rules** one more time — confirm the catch-all `allow read, write: if false` is the last rule.

4. **Add a LICENCE file** — pick a licence for your source code. MIT is common for personal projects:
   ```bash
   # Example MIT licence
   curl -o LICENCE https://raw.githubusercontent.com/nicowillis/mit-license/master/LICENSE
   # Edit to add your name and year
   ```

5. **Tag the release:**
   ```bash
   git tag -a v1.0.0 -m "Initial public release — Milestone 9"
   git push origin v1.0.0
   ```

6. **Switch visibility** on GitHub: Repository → Settings → Danger Zone → **Change repository visibility → Public**.

7. **Post-public smoke test:**
   - Sign in on a fresh browser profile
   - Tick one item, reload — confirm it persists
   - Install the PWA
   - Check the browser console for CSP violations or errors

---

## 6. Optional Hardening (Post-Launch)

- Enable [Firestore PITR (Point-in-time recovery)](https://firebase.google.com/docs/firestore/pitr) if you move to a paid plan.
- Add [Firebase App Check](https://firebase.google.com/docs/app-check) to restrict Firestore access to your domain only.
- Add a `SECURITY.md` to tell users how to report vulnerabilities.
- Set up [Dependabot](https://docs.github.com/en/code-security/dependabot) for automated dependency updates.
