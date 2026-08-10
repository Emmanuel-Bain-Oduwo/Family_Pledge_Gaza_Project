import React from 'react';
import LegalPage from '../components/LegalPage';

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How Family Pledge handles account, pledge, contribution and notification data."
      sections={[
        {
          title: 'Who we are',
          paragraphs: [
            'Family Pledge is a charitable initiative operated under the National Muslim Leaders Forum (NAMLEF) in Kenya. Family Pledge organizes the initiative and donations are received by NAMLEF.',
            'For privacy or support questions, contact admin@familypledgekenya.org. Our public website is https://www.familypledgekenya.org.',
          ],
        },
        {
          title: 'Information we collect',
          paragraphs: [
            'When you create an account we may collect your name, nickname, phone number, email address, country, city and account authentication information.',
            'When you pledge or contribute we record the pledge/contribution amount, currency, date/month, payment channel and review status. If you submit a transaction message/reference or payment screenshot, that proof may contain personal or financial information.',
            'If you enable notifications, we store a push-notification token and your notification preferences so Family Pledge can send the categories you choose.',
          ],
        },
        {
          title: 'Payment proof privacy and retention',
          paragraphs: [
            'New payment screenshots are stored in a private Cloudflare R2 bucket and are not published through the public media domain. Authorized administrators receive only short-lived signed links when a screenshot must be reviewed.',
            'Payment screenshots and raw transaction message/reference data are retained for up to 30 days and then removed. The underlying contribution and pledge accounting record may remain without the deleted proof material.',
          ],
        },
        {
          title: 'How we use information',
          paragraphs: [
            'We use account information to provide login and profile functionality, record pledges, verify contribution submissions, show relevant Family Pledge content, operate collector/community features, prevent duplicate or fraudulent submissions, and provide requested notifications.',
            'Badges and rankings are recognition features based on participation; they do not unlock premium digital content or paid app functionality.',
          ],
        },
        {
          title: 'Service providers',
          paragraphs: [
            'Family Pledge uses infrastructure and service providers including OVHcloud for backend hosting, PostgreSQL for application data, Cloudflare for DNS/R2 media/Stream video, Vercel for web delivery, and Expo/Apple/Google services for native app distribution and notifications where configured.',
            'We limit shared data to what is needed for those services to operate. We do not publish private payment proofs as public media.',
          ],
        },
        {
          title: 'Account deletion',
          paragraphs: [
            'You can initiate account deletion from the app under Profile → Account & Privacy → Delete Account. Personal profile information, login access, notification tokens, badges/rankings and related app-only profile data are removed.',
            'Contribution and pledge accounting records may remain in anonymized form. You can also visit /account-deletion on the Family Pledge website for deletion instructions if you no longer have access to the app.',
          ],
        },
        {
          title: 'Security and contact',
          paragraphs: [
            'We use access controls, authenticated APIs, private storage for sensitive proof files and encrypted HTTPS connections. No internet service can guarantee absolute security, so we continuously review access and retention controls.',
            'Privacy and support contact: admin@familypledgekenya.org. Address: Nairobi, Kenya, 00100.',
          ],
        },
      ]}
    />
  );
}
