# Family Pledge Store Release Checklist

Use this checklist for the first Google Play / Apple App Store release. PR F supplies the final store metadata and declarations.

## Security and privacy

- [ ] Private R2 proof bucket exists with no public domain / r2.dev URL.
- [ ] Scoped `PROOF_R2_*` credentials are configured only on the backend/OVH environment.
- [ ] Donor screenshot upload succeeds through the private signed PUT flow.
- [ ] A non-admin cannot obtain a proof-view URL.
- [ ] An admin can open a short-lived proof link.
- [ ] 30-day proof/reference purge script succeeds.
- [ ] Daily purge scheduling is enabled and monitored.
- [ ] Account deletion removes personal profile data and login access.
- [ ] Account deletion preserves only anonymized pledge/contribution accounting history.

## Public legal resources

- [ ] `https://www.familypledgekenya.org/privacy` is public.
- [ ] `https://www.familypledgekenya.org/terms` is public.
- [ ] `https://www.familypledgekenya.org/account-deletion` is public.
- [ ] `https://www.familypledgekenya.org/support` is public.
- [ ] Links inside the donor app open correctly.

## Expo SDK 55

- [ ] Node 20.19+ in use.
- [ ] `package-lock.json` regenerated for SDK 55 and committed.
- [ ] `npx expo install --check` passes.
- [ ] `npx expo-doctor@latest` passes without release-blocking errors.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build:web` passes.
- [ ] Expo Web registration/login/media flows still work.

## EAS and signing

- [ ] `eas whoami` shows the intended Expo account.
- [ ] `eas project:info` confirms the intended EAS project.
- [ ] Android signing credentials are configured/backed up appropriately.
- [ ] Apple signing credentials/provisioning are configured.
- [ ] Android FCM V1 push credentials are configured in EAS.
- [ ] iOS APNs push credentials are configured in EAS.

## Android physical-device preview

- [ ] Preview APK builds successfully.
- [ ] Preview APK installs on a real Android device.
- [ ] Register/login works.
- [ ] Session persists after app restart.
- [ ] Public R2 images render.
- [ ] Cloudflare Stream video plays.
- [ ] Native payment screenshot picker works.
- [ ] Private proof upload/submission works.
- [ ] Daily local reminder works.
- [ ] Friday local reminder works.
- [ ] Campaign remote push works.
- [ ] Emergency remote push works.
- [ ] Preference toggles stop disabled categories.
- [ ] Offline/API failure shows real error/cached real profile, not fabricated data.
- [ ] Account deletion works end-to-end.

## Google Play internal testing

- [ ] Production AAB builds successfully.
- [ ] AAB uploaded to Internal Testing.
- [ ] Play-delivered app installs.
- [ ] Critical flows repeated on Play-delivered build.
- [ ] No manifest/permission/signing/target-SDK blockers.

## iOS / TestFlight

- [ ] iOS production build succeeds.
- [ ] Build appears in App Store Connect/TestFlight.
- [ ] Real iPhone tester can install it.
- [ ] Register/login/session persistence works.
- [ ] Native proof picker/private upload works.
- [ ] APNs remote push works foreground/background/closed.
- [ ] Local Daily/Friday reminders work.
- [ ] Media/video works.
- [ ] Account deletion works.
- [ ] Cold-start notification routing works.

## Backend/release commit

- [ ] `/health` returns healthy.
- [ ] `/ready` returns ready after latest migrations.
- [ ] Database backup succeeds before release deployment.
- [ ] Release commit SHA recorded.
- [ ] Android and iOS production builds use the same approved release commit.
- [ ] PR F store metadata/compliance package approved before public submission.
