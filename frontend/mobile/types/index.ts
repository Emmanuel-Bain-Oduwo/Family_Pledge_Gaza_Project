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
  notification_daily?: boolean;
  notification_friday?: boolean;
  notification_campaigns?: boolean;
  notification_emergency?: boolean;
  notification_quran?: boolean;
  notification_hadith?: boolean;
  notification_dua?: boolean;
  notification_dhikr?: boolean;
  notification_shirk?: boolean;
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
  motivation: boolean;
  impact: boolean;
  humanitarian: boolean;
  onboarding_seen: boolean;
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
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earned_at?: string;
}

export interface EngagementGoal {
  id: string;
  goal_type: string;
  title: string;
  target_count: number;
  current_count: number;
  cadence: string;
  status: 'active' | 'completed' | 'archived';
  starts_on: string;
  ends_on?: string;
  created_at: string;
}

export interface ImpactJourney {
  current_consistency_months: number;
  longest_consistency_months: number;
  confirmed_contributions: number;
  pledge_since?: string | null;
  campaigns_supported: number;
  impact_updates_viewed: number;
  campaigns_shared: number;
  circles_joined: number;
}

export interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: number;
  target: number;
}

export interface PledgeCircleStats {
  member_count: number;
  active_members: number;
  participation_rate: number;
  confirmed_actions_this_month: number;
  consistency_score: number;
}

export interface PledgeCircleMember {
  user_id: string;
  display_name: string;
  role: string;
  joined_at: string;
}

export interface PledgeCircle {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  owner_user_id: string;
  is_owner: boolean;
  share_url: string;
  stats: PledgeCircleStats;
  members?: PledgeCircleMember[];
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
  monthly_progress: { target: number; current: number };
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
  referral_code?: string;
}

export interface LoginPayload {
  phone_or_email: string;
  password: string;
}

export interface ContributionPayload {
  campaign_id?: string;
  pledge_id?: string;
  amount?: number;
  currency: string;
  reference?: string;
  proof_url?: string;
  payment_method?: string;
  transaction_reference?: string;
  proof_image_url?: string;
  proof_object_key?: string;
  contribution_channel?: string;
  contribution_month?: string;
  payment_link_used?: string;
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
