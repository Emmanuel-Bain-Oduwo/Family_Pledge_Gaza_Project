# Admin Handover Guide — Family Pledge

This guide is for the Family Pledge administrators who operate the web dashboard, review contributions, manage campaign content, and communicate with donors.

## Production admin access

Current admin deployment:

```text
https://family-pledge-gaza-project.vercel.app
```

The admin frontend must be configured with:

```env
NEXT_PUBLIC_API_URL=https://api.familypledgekenya.org/api/v1
```

If login fails immediately after a backend migration/cutover, sign out or clear the old browser session and log in again. A token issued by the previous backend may not be valid against the OVH `JWT_SECRET`.

Only accounts with the admin role should access protected admin routes.

---

## 1. Dashboard

The dashboard summarizes operational data such as donors, pledges, contributions, pending reviews, campaigns, and tracked totals.

If data suddenly looks empty after a backend cutover, confirm that the production database was migrated before treating it as a frontend bug.

---

## 2. Reviewing contributions

Donors submit contribution records and may attach proof. Admins must verify the payment independently before confirming it.

1. Open **Contributions**.
2. Select a submitted/pending contribution.
3. Review donor details, amount/currency, reference, payment method, and proof.
4. Compare the submission with the official payment/bank record.
5. Confirm only when verified.
6. Reject with a clear internal note if the contribution cannot be verified.

Contribution proof media is sensitive. Do not repost or share it publicly.

---

## 3. Campaigns

1. Open **Campaigns**.
2. Create or edit the campaign.
3. Add title, type, description, targets, dates, and status.
4. Upload a cover image when required.
5. Activate/publish only after the details have been checked.

Campaign image uploads use the production media stack through the OVH backend and Cloudflare R2.

---

## 4. Projects and impact cards

Impact content should describe verified activity and outcomes.

For each impact/project item:

- use factual titles and descriptions;
- include beneficiary counts only when verified;
- upload appropriate images through the admin media flow;
- upload video through the Cloudflare Stream flow where supported;
- avoid estimates presented as confirmed facts.

Production image/media origin currently uses the configured Cloudflare R2 public base under `familypledgekenya.org`.

---

## 5. Daily reminders and Islamic content

Reminder drafts may include Quran, Hadith, du'a, motivation, or Friday content.

For religious content:

1. Create or generate the draft.
2. Read the complete text.
3. Verify Quran/Hadith references using a trusted source.
4. Correct or reject anything uncertain.
5. Publish only after human review.

AI-generated content is a draft aid, not an authority.

---

## 6. AI assistant

The AI assistant is intended to remain **draft/suggest-only**.

Human approval is required before operational use of:

- reminders;
- impact updates;
- weekly summaries;
- collector messages;
- other generated communications.

Admins must verify facts, names, dates, statistics, religious references, and tone before approving content.

The AI must not directly approve/reject contributions, delete donors, publish sensitive content, or bypass administrator review.

---

## 7. Push notifications

1. Open **Notifications**.
2. Enter a concise title/body.
3. Select the correct notification type and audience.
4. Review the audience carefully before sending.
5. Send only when the message is ready.

Native push delivery requires valid Expo/EAS plus Android FCM and Apple APNs configuration. A successful admin API request alone does not prove that a real device received the notification.

---

## 8. Collectors

Collectors are trusted users who manage or invite donor groups/circles.

When creating or managing a collector:

- confirm that the underlying user account is correct;
- verify the collector code and group details;
- avoid exposing private donor membership information outside the admin workflow.

---

## 9. NAMLEF content

NAMLEF content can include text, images, audio, video, or links.

Before publishing:

- verify the speaker/name/role;
- verify any external URL;
- use Cloudflare R2/Stream uploads where appropriate;
- make sure featured content is intentional;
- do not publish unverified field claims.

---

## 10. Production media checks

If an image upload fails:

1. Confirm the admin is authenticated against the OVH API.
2. Confirm the request reaches `https://api.familypledgekenya.org/api/v1`.
3. Check OVH backend logs.
4. Check Cloudflare R2 object permissions and browser CORS.
5. Confirm the object appears in `family-pledge-media`.

If a video upload fails:

1. Check the OVH backend logs for the Stream direct-upload request.
2. Confirm Stream credentials are valid on the backend.
3. Confirm the asset appears in Cloudflare Stream.
4. Wait for processing before judging playback failure.

Never expose R2 or Stream secret credentials in the browser.

---

## 11. Security reminders

- Never share admin passwords.
- Each administrator should use their own account.
- Log out on shared devices.
- Do not export or send donor personal data through unsecured channels.
- Do not expose contribution proof images publicly.
- Never paste production secrets, database passwords, JWT secrets, R2 keys, Stream tokens, or SMTP credentials into frontend environment variables.
- Report suspected account compromise immediately.

---

## 12. Operational outage checklist

If the admin dashboard stops working:

1. Check `https://api.familypledgekenya.org/health`.
2. Check `https://api.familypledgekenya.org/ready`.
3. Confirm Vercel is using the OVH API URL.
4. Inspect OVH backend logs.
5. Confirm the production database contains the expected data.
6. Check Cloudflare DNS/proxy status if the API is unreachable.
7. Use Railway only as a deliberate rollback fallback while it is still retained.

Do not change multiple infrastructure components at once unless the failure requires it.

---

## Quick reference

| Task | Location |
|---|---|
| Log in | Admin Vercel dashboard |
| Review contribution | Contributions |
| Create/edit campaign | Campaigns |
| Add impact/project content | Impact / Projects |
| Create reminder | Reminders |
| Generate draft | AI Assistant |
| Send push | Notifications |
| Manage collector | Collectors |
| Add NAMLEF content | NAMLEF Content |
| Check API health | `https://api.familypledgekenya.org/health` |
| Check DB readiness | `https://api.familypledgekenya.org/ready` |

For deployment and infrastructure procedures, use `docs/DEPLOYMENT.md` and `deploy/ovh/README.md` rather than this operator guide.
