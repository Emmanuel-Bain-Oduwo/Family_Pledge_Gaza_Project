import React from 'react';
import LegalPage from '../components/LegalPage';

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      subtitle="Terms for using the Family Pledge application and web experience."
      sections={[
        {
          title: 'About Family Pledge',
          paragraphs: [
            'Family Pledge is a charitable initiative operated under the National Muslim Leaders Forum (NAMLEF) in Kenya. Family Pledge organizes the initiative and donations are received by NAMLEF.',
            'By using the application or website you agree to use the service lawfully and to provide accurate information when creating an account, making a pledge or submitting a contribution for verification.',
          ],
        },
        {
          title: 'Pledges and contributions',
          paragraphs: [
            'A free pledge does not require payment. Where a user chooses to contribute, the app may display approved payment instructions and allow the user to submit a transaction reference/message or screenshot for administrative verification.',
            'A contribution does not purchase premium app functionality, digital content or exclusive paid access. Badges and rankings are recognition of participation only.',
          ],
        },
        {
          title: 'Verification and records',
          paragraphs: [
            'Family Pledge administrators may confirm, reject or request follow-up for contribution submissions. Users must not submit altered, misleading or duplicated transaction proof.',
            'Sensitive payment screenshots and raw transaction reference/message data are subject to the privacy policy and a 30-day retention period. Contribution and pledge accounting history may remain in anonymized form where required for legitimate records.',
          ],
        },
        {
          title: 'Content and acceptable use',
          paragraphs: [
            'Family Pledge may publish campaign, impact, reminder, educational and NAMLEF-related content. Users must not misuse the service, attempt unauthorized access, interfere with other users, or upload malicious or unlawful material.',
            'Islamic reminders and humanitarian information are provided for awareness and community engagement; users should not treat general app content as individualized legal, financial or professional advice.',
          ],
        },
        {
          title: 'Availability and changes',
          paragraphs: [
            'We may update, maintain, suspend or change parts of the service when needed for security, reliability, compliance or program operations. We aim to keep the service available but cannot guarantee uninterrupted access.',
          ],
        },
        {
          title: 'Contact',
          paragraphs: [
            'Questions about these terms can be sent to admin@familypledgekenya.org. Family Pledge, Nairobi, Kenya, 00100.',
          ],
        },
      ]}
    />
  );
}
