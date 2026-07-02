# Vercel Admin Deploy Fix

## Why the build is failing

If Vercel shows this error:

```text
Running "install" command: `cd frontend/admin && npm install`...
sh: line 1: cd: frontend/admin: No such file or directory
```

then Vercel is already running from a directory where `frontend/admin` does not exist, or the Vercel project still has an old install-command override that tries to enter `frontend/admin` from the wrong place.

If the Vercel Root Directory is already `frontend/admin`, that means Vercel is effectively trying to run this path:

```text
frontend/admin/frontend/admin
```

That nested folder does not exist in this clean monorepo, so the build correctly fails.

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

A root-level `vercel.json` is also included for the alternate setup where the Vercel project root is the repository root. In that mode, Vercel runs `cd frontend/admin && npm install`, builds with `cd frontend/admin && npm run build`, and publishes `frontend/admin/.next`.

Do not create a nested `frontend/admin/frontend/admin` folder to work around dashboard settings. Keep the repo clean and fix the Vercel project settings instead.

## User/mobile app reminder

This Vercel project deploys only the admin dashboard. The mobile user and collector app lives in `frontend/mobile` and is previewed with Expo or released through EAS to Android/iOS.
