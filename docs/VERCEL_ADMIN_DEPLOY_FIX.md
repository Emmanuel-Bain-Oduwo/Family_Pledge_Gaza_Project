# Vercel Admin Deploy Fix

## Why the build is failing

If Vercel shows this error:

```text
Running "install" command: `cd frontend/admin && npm install`...
sh: line 1: cd: frontend/admin: No such file or directory
```

then Vercel is already running inside the `frontend/admin` directory, but the Vercel project still has an old install-command override that tries to enter `frontend/admin` again.

That means Vercel is effectively trying to run this path:

```text
frontend/admin/frontend/admin
```

That nested folder should not exist in a clean monorepo, so the build correctly fails.

## Correct Vercel project settings

Open the Vercel project dashboard and set these values:

- **Root Directory:** `frontend/admin`
- **Framework Preset:** Next.js
- **Install Command:** `npm install`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

If Vercel has an override containing `cd frontend/admin && npm install`, remove it. Do not use `cd frontend/admin` when the Root Directory is already `frontend/admin`.

## If Vercel is blocking a pull request merge

The failing Vercel check is using the Vercel project settings from the dashboard. Fix the dashboard settings above, then redeploy the failed preview deployment or push a new commit to refresh the check.

## Repo-side config

The repo-side Vercel config is scoped to the admin app at:

```text
frontend/admin/vercel.json
```

It intentionally runs commands from inside `frontend/admin`:

```json
{
  "version": 2,
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

There should not be a root-level `vercel.json` for this setup.


## Compatibility shim

The repo also includes a small compatibility shim at `frontend/admin/frontend/admin` that points back to the real admin app. This means the old Vercel command `cd frontend/admin && npm install` will no longer fail even if Vercel is already rooted at `frontend/admin`. The clean long-term setting is still to remove the old dashboard override and use `npm install` directly.

## User/mobile app reminder

This Vercel project deploys only the admin dashboard. The mobile user and collector app lives in `frontend/mobile` and is previewed with Expo or released through EAS to Android/iOS.
