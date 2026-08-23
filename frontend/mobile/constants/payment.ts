export const PAYMENT_SETTINGS = {
  pledgeOptions: [
    { key: 'usd10', label: '$10', amount: 10, currency: 'USD', helper: 'Standard Family Pledge' },
    { key: 'usd20', label: '$20', amount: 20, currency: 'USD', helper: 'Increase your pledge' },
    { key: 'usd50', label: '$50', amount: 50, currency: 'USD', helper: 'Support more families' },
    { key: 'usd100', label: '$100', amount: 100, currency: 'USD', helper: 'Make a greater impact' },
    { key: 'open', label: 'Other amount', amount: 0, currency: 'USD', helper: 'Give what you can' },
    { key: 'free', label: 'Free pledge', amount: 0, currency: 'USD', helper: 'Awareness-only signup' },
  ],
  methods: [
    { key: 'mpesa', label: 'M-PESA', icon: 'phone-portrait-outline', color: '#10B981' },
    { key: 'bank', label: 'Bank Transfer', icon: 'business-outline', color: '#20506D' },
  ],
  bank: {
    accountName: 'NAMLEF GAZA FAMILY SUPPORT',
    accountNumber: '001505100664103',
    currency: 'KES',
    accountType: 'Business Pay As You Go',
    bankName: 'DIB Bank Kenya Limited',
    branchName: 'Upper Hill Branch',
    swiftCode: 'DUIBKENA',
    intermediaryBankUsd: 'J.P. Morgan Chase Bank, NY',
    intermediarySwiftCode: 'CHASUS33',
    branchPostalAddress: 'DIB Bank Head office, Bunyala Road Lower Hill Junction, P.O. Box 6450 - 00200, Nairobi, Kenya.',
    mpesaPaybill: '342342',
    mpesaAccount: '133133',
    bankCode: '75',
    branchCode: '001',
  },
};

export const currentContributionMonth = () => new Date().toISOString().slice(0, 7);
