import React from 'react';
import LegalPage from '../components/LegalPage';

export default function SupportPage() {
  return (
    <LegalPage
      title="Support"
      subtitle="Help with Family Pledge accounts, pledges, contribution verification and app access."
      sections={[
        {
          title: 'Contact Family Pledge',
          paragraphs: [
            'Support email: admin@familypledgekenya.org.',
            'Website: https://www.familypledgekenya.org. Address: Nairobi, Kenya, 00100.',
          ],
        },
        {
          title: 'Contribution support',
          paragraphs: [
            'If a contribution is still awaiting verification, include the month, approximate amount and payment channel when contacting support. Do not send passwords, full banking credentials or unnecessary payment screenshots by email.',
            'Authorized administrators can review proof submitted securely through the app. Sensitive screenshots and raw transaction references/messages are retained for up to 30 days.',
          ],
        },
        {
          title: 'Account and privacy support',
          paragraphs: [
            'For account deletion, use Profile → Account & Privacy → Delete Account, or visit the Account Deletion page if you cannot access the app.',
            'Privacy questions and requests can also be sent to admin@familypledgekenya.org.',
          ],
        },
        {
          title: 'About the initiative',
          paragraphs: [
            'Family Pledge is a charitable initiative operated under the National Muslim Leaders Forum (NAMLEF). Donations are received by NAMLEF and Family Pledge coordinates the initiative and its community activities.',
          ],
        },
      ]}
    />
  );
}
