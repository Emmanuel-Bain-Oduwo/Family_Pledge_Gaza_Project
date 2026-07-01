export interface User {
  id: string;
  full_name: string;
  nickname?: string;
  phone?: string;
  email?: string;
  country?: string;
  city?: string;
  anonymous_publicly: boolean;
  public_display_name?: string;
  collector_code?: string;
  is_collector?: boolean;
  role?: string;
  pledge_status?: PledgeStatus;
  donor_number?: number;
  badges?: Badge[];
  created_at: string;
}

export type PledgeStatus = 'paid' | 'pending' | 'missed' | 'free_participant' | 'none';

export interface Pledge {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  pledge_type?: string;
  status: string;
  start_date?: string;
  created_at?: string;
  updated_at?: string;
  month?: string;
  year?: number;
  contributed_at?: string;
  reference?: string;
}

export interface PledgeStatusOut {
  has_active_pledge: boolean;
  pledge: Pledge | null;
  confirmed_contributions_count: number;
  current_month_contributed: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  campaign_type?: string;
  type: string;
  target_donors: number;
  current_donors: number;
  donor_target?: number;
  donor_count?: number;
  target_amount?: number;
  raised_amount?: number;
  cover_image_url?: string;
  image_url?: string;
  video_url?: string;
  is_active?: boolean;
  is_urgent?: boolean;
  status?: string;
  start_date?: string;
  end_date?: string;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
}

export interface ImpactCard {
  id: string;
  title: string;
  story?: string;
  description?: string;
  category: string;
  image_url?: string;
  video_url?: string;
  beneficiaries?: number;
  beneficiaries_count?: number;
  location?: string;
  date?: string;
  created_at?: string;
}

export interface Reminder {
  id: string;
  type: string;
  reminder_type?: string;
  title?: string;
  text: string;
  arabic_text?: string;
  translation?: string;
  explanation?: string;
  source_reference?: string;
  image_url?: string;
  date?: string;
  created_at?: string;
}

export interface NamlefContent {
  id: string;
  title: string;
  content_type?: string;
  type: string;
  content: string;
  description?: string;
  speaker_name?: string;
  speaker_role?: string;
  author?: string;
  author_title?: string;
  url?: string;
  thumbnail_url?: string;
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  is_featured?: boolean;
  featured?: boolean;
  status?: string;
  date?: string;
  created_at?: string;
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
  invite_link?: string;
  member_count?: number;
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
  pledge_summary?: PledgeStatusOut;
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
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
