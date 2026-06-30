export interface User {
  id: string;
  full_name: string;
  nickname?: string;
  phone: string;
  email?: string;
  country: string;
  city?: string;
  anonymous_publicly: boolean;
  collector_code?: string;
  is_collector: boolean;
  pledge_status: PledgeStatus;
  donor_number?: number;
  badges: Badge[];
  created_at: string;
}

export type PledgeStatus = 'paid' | 'pending' | 'missed' | 'free_participant' | 'none';

export interface Pledge {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: PledgeStatus;
  month: string;
  year: number;
  contributed_at?: string;
  reference?: string;
  proof_url?: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  type: 'friday_challenge' | 'emergency' | 'monthly' | 'general';
  target_donors: number;
  current_donors: number;
  target_amount?: number;
  raised_amount?: number;
  image_url?: string;
  is_active: boolean;
  is_urgent: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
}

export interface ImpactCard {
  id: string;
  title: string;
  description: string;
  category: 'food' | 'medical' | 'shelter' | 'education' | 'water' | 'general';
  image_url?: string;
  video_url?: string;
  beneficiaries?: number;
  location?: string;
  date: string;
}

export interface Reminder {
  id: string;
  type: 'quran' | 'hadith' | 'dua' | 'motivation' | 'friday';
  arabic_text?: string;
  text: string;
  translation?: string;
  explanation?: string;
  source_reference?: string;
  date: string;
}

export interface NamlefContent {
  id: string;
  type: 'about' | 'sheikh_message' | 'introduction' | 'voice_of_support';
  title: string;
  content: string;
  author?: string;
  author_title?: string;
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  date: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earned_at?: string;
}

export interface CollectorDashboard {
  collector_code: string;
  total_registered: number;
  contributed_this_month: number;
  pending_this_month: number;
  circle_members: CircleMember[];
  invite_link: string;
}

export interface CircleMember {
  id: string;
  display_name: string;
  pledge_status: PledgeStatus;
  joined_at: string;
}

export interface Dashboard {
  user: User;
  pledge_status: PledgeStatus;
  donor_number: number;
  total_donors_today: number;
  active_campaign?: Campaign;
  emergency_appeal?: Campaign;
  latest_reminder?: Reminder;
  latest_impact?: ImpactCard;
  monthly_progress: {
    target: number;
    current: number;
  };
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

export interface RegisterPayload {
  full_name: string;
  nickname?: string;
  phone: string;
  email?: string;
  country: string;
  city?: string;
  password: string;
  anonymous_publicly: boolean;
  collector_code?: string;
}

export interface LoginPayload {
  phone_or_email: string;
  password: string;
}

export interface ContributionPayload {
  campaign_id?: string;
  amount: number;
  currency: string;
  reference: string;
  proof_url?: string;
  payment_method: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}
