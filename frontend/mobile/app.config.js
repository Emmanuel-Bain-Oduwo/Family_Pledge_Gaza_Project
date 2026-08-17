const fs = require('node:fs');
const path = require('node:path');

const base = require('./app.json').expo;

/**
 * Build-time native configuration.
 *
 * Firebase remains notification transport only. The Android google-services
 * client file can be supplied as an EAS file environment variable named
 * GOOGLE_SERVICES_JSON, or as a local git-ignored google-services.json file.
 * The Firebase service-account private key is backend/EAS credential material
 * and must never be exposed through EXPO_PUBLIC_* variables.
 */
module.exports = () => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || base.extra?.eas?.projectId;
  const localGoogleServices = path.join(__dirname, 'google-services.json');
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON
    || (fs.existsSync(localGoogleServices) ? './google-services.json' : undefined);

  const extra = { ...(base.extra || {}) };
  if (projectId) {
    extra.eas = { ...(extra.eas || {}), projectId };
  }

  const android = { ...base.android };
  if (googleServicesFile) {
    android.googleServicesFile = googleServicesFile;
  }

  return {
    ...base,
    android,
    ...(Object.keys(extra).length ? { extra } : {}),
  };
};
