# Vercel Frontend Root Compatibility Package

This folder supports a stale Vercel command when the Vercel Root Directory is set to `frontend` but the install/build command still runs:

```sh
cd frontend/admin && npm install
```

The package delegates back to the real admin app at `frontend/admin`.
