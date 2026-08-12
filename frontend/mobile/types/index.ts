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
  weekly_email_opt_in?: boolean;
  email_reminders_opt_in?: boolean;
  whatsapp_reminders_opt_in?: boolean;
  notification_daily?: boolean;
  notification_friday?: boolean;
  notification_campaigns?: boolean;
  notification_emergency?: boolean;
  notification_quran?: boolean;
  notification_hadith?: boolean;
  notification_dua?: boolean;
  notification_dhikr?: boolean;
  notification_shirk?: boolean;
  notification_sadaqah?: boolean;
  notification_motivation?: boolean;
  notification_impact?: boolean;
  notification_humanitarian?: boolean;
  notification_onboarding_seen?: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  daily: boolean;
  friday: boolean;
  campaigns: boolean;
  emergency: boolean;
  quran: boolean;
  hadith: boolean;
  dua: boolean;
  dhikr: boolean;
  shirk: boolean;
  sadaqah: boolean;
  motivation: boolean;
  impact: boolean;
  humanitarian: boolean;
  onboarding_seen: boolean;
}

export type PledgeStatus = 'paid' | 'submitted' | 'needs_follow_up' | 'rejected' | 'pending' | 'missed' | 'free_participant' | 'none';

export interface Pledge {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  pledge_type?: string;
  status: string;
  start_date?: string;
  agreement_accepted_at?: string;
  agreement_version?: string;
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
  current_month_status?: 'submitted' | 'confirmed' | 'rejected' | 'needs_follow_up' | null;
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

export interface SupportMessage {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  admin_response?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
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

export interface UserNotification {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  content_category?: string;
  audience: string;
  sent_at?: string;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  earned_at?: string;
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
  monthly_progress: { target: number; current: number };
  pledge_summary?: PledgeStatusOut;
}

export interface CollectorDashboard {
  collector: { code: string; donor_count: number; total_contributions: number };
  members: User[];
}

export interface RegisterPayload {
  full_name: string;
  phone: string;
  email?: string;
  password: string;
  country: string;
  city?: string;
  nickname?: string;
  referral_code?: string;
}

export interface LoginPayload {
  phone_or_email: string;
  password: string;
}

export interface ContributionPayload {
  pledge_id?: string;
  campaign_id?: string;
  amount?: number;
  currency?: string;
  contribution_channel?: string;
  payment_method?: string;
  payment_link_used?: string;
  transaction_reference?: string;
  reference?: string;
  proof_object_key?: string;
  proof_image_url?: string;
  proof_url?: string;
  contribution_month?: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface EngagementGoal {
  id: string;
  goal_type: string;
  title: string;
  target_count: number;
  current_count: number;
  cadence: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImpactJourney {
  active_pledge: boolean;
  confirmed_contributions: number;
  support_messages: number;
  goals_completed: number;
  circles_joined: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  achieved: boolean;
  achieved_at?: string;
}

export interface PledgeCircle {
  id: string;
  name: string;
  description?: string;
  code: string;
  owner_user_id: string;
  member_count: number;
  created_at: string;
}
