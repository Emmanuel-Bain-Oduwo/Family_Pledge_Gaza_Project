import Constants from 'expo-constants';

export const Config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.familypledge.org/api/v1',
  APP_NAME: 'Family Pledge',
  PLEDGE_AMOUNT: 10,
  PLEDGE_CURRENCY: 'USD',
  FRIDAY_CHALLENGE_GOAL: 200,
  NAMLEF_WEBSITE: 'https://namlef.org',
  PAYMENT_LINK: 'https://familypledge.org/contribute',
  SUPPORT_EMAIL: 'support@familypledge.org',
  WHATSAPP_SUPPORT: '+254700000000',
  VERSION: '1.0.0',
};
