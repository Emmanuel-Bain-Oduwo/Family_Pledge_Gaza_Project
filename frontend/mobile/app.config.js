const fs = require('node:fs');
const path = require('node:path');

/**
 * Build-time native configuration.
 *
 * Expo passes the values from app.json as `config`; keeping that object as the
 * base means Expo Doctor can verify that the static and dynamic configs remain
 * connected.
 *
 * Firebase remains notification transport only. The Android google-services
 * client file can be supplied as an EAS file environment variable named
 * GOOGLE_SERVICES_JSON, or as a local git-ignored google-services.json file.
 * The Firebase service-account private key is backend/EAS credential material
 * and must never be exposed through EXPO_PUBLIC_* variables.
 */
module.exports = ({ config }) => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || config.extra?.eas?.projectId;
  const localGoogleServices = path.join(__dirname, 'google-services.json');
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON
    || (fs.existsSync(localGoogleServices) ? './google-services.json' : undefined);

  const extra = { ...(config.extra || {}) };
  if (projectId) {
    extra.eas = { ...(extra.eas || {}), projectId };
  }

  const android = { ...config.android };
  if (googleServicesFile) {
    android.googleServicesFile = googleServicesFile;
  }

  return {
    ...config,
    android,
    ...(Object.keys(extra).length ? { extra } : {}),
  };
};
