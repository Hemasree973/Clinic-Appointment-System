# GitHub Version Control & Branch Protection Rules

## 1. Centralized Repository Strategy

This project adheres to a centralized GitHub workflow featuring trunk-based branching and protected production releases.

```
       [feature/slot-validation] ──┐
                                   │ (PR + Review + CI)
[main] ────────────────────────────┴───────────────────────► Production Release
       (Protected Branch: No Direct Pushes Allowed)
```

- **`main`**: Production-ready branch. Direct push is strictly forbidden. All code enters via reviewed and passing Pull Requests.
- **`feature/*`**: Dedicated branches for new features (e.g. `feature/slot-conflict-middleware`).
- **`bugfix/*`**: Dedicated branches for verified defects (linked to GitHub Issue tickets).

---

## 2. GitHub Branch Protection Rules Configuration for `main`

To configure branch protection rules in GitHub:

1. Navigate to your GitHub repository: `https://github.com/<org-or-user>/<repo-name>`.
2. Click **Settings** (tab at the top).
3. In the left sidebar under *Code and automation*, click **Branches**.
4. Click **Add branch protection rule** (or edit existing rule for `main`).
5. In **Branch name pattern**, enter: `main`.

### Recommended Rule Checklist:

| Rule Setting | Recommended State | Rationale |
| :--- | :--- | :--- |
| **Require a pull request before merging** | **ENABLED** | Prevents direct pushes to production; mandates peer reviews. |
| ↳ *Required approvals* | **1 or 2 approvals** | Ensures clinical booking logic and overlap checks are verified. |
| ↳ *Dismiss stale pull request approvals when new commits are pushed* | **ENABLED** | Re-triggers review if developer alters booking code after sign-off. |
| ↳ *Require review from Code Owners* | **ENABLED** | Core maintainers must sign off on changes to `/backend/middleware/` and `/sql/`. |
| **Require status checks to pass before merging** | **ENABLED** | Guarantees automated test passing prior to release. |
| ↳ *Require branches to be up to date before merging* | **ENABLED** | Prevents merging code with stale database schema assumptions. |
| ↳ *Status check: `Backend Lint & Smoke Test`* | **ENABLED** | CI workflow check defined in `.github/workflows/ci.yml`. |
| ↳ *Status check: `Frontend Build & Type Validation`* | **ENABLED** | CI build verification for Vite + React bundle. |
| **Require signed commits** | **ENABLED** | Verifies committer identity using GPG/SSH keys. |
| **Require linear history** | **ENABLED** | Keeps git graph clean via Squash-and-Merge or Rebase. |
| **Do not allow bypassing the above settings** | **ENABLED** | Applies protection rules to repository administrators as well. |
| **Restrict who can push to matching branches** | **ENABLED** | Only authorized release managers can merge to `main`. |

---

## 3. GitHub Issue Tracker Integration

Issue templates are pre-configured in `.github/ISSUE_TEMPLATE/`:
- **Bug Report** (`.github/ISSUE_TEMPLATE/bug_report.md`): Structured template capturing doctor slot timing, reproduction steps, error logs, and environment.
- **Feature Request** (`.github/ISSUE_TEMPLATE/feature_request.md`): Business case and technical changes across React frontend, Express routes, and MySQL tables.

### Pull Request Linking
Link every pull request to its corresponding issue:
```markdown
Closes #12 - Fix doctor overlap race condition in checkOverlap middleware
```
GitHub automatically closes the issue once the PR is merged into `main`.
