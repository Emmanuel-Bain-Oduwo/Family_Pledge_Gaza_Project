# Vercel Compatibility Package

This folder exists only to support a stale Vercel dashboard override that runs:

```sh
cd frontend/admin && npm install
```

when the Vercel Root Directory is already `frontend/admin`.

The package scripts delegate back to the real admin app two directories up. The preferred Vercel settings remain:

- Root Directory: `frontend/admin`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `.next`
