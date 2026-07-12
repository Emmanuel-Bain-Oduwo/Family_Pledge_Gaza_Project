export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export type PledgeStatus = 'paid' | 'pending' | 'missed' | 'free_participant' | 'none';

export interface Donor {
  id: string;
  full_name: string;
  nickname?: string;
  phone: string;
  email?: string;
  country: string;
  city?: string;
  anonymous_publicly: boolean;
  is_collector: boolean;
  collector_code?: string;
  pledge_status: PledgeStatus;
  donor_number?: number;
  created_at: string;
}

export type ContributionStatus = 'submitted' | 'confirmed' | 'rejected' | 'needs_follow_up';

export interface Contribution {
  id: string;
  user_id: string;
  donor_name: string;
  donor_phone: string;
  amount: number;
  currency: string;
  reference: string;
  proof_url?: string;
  payment_method: string;
  status: ContributionStatus;
  admin_note?: string;
  month: string;
  year: number;
  campaign_id?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export type CampaignType =
  | 'monthly'
  | 'friday_challenge'
  | 'emergency'
  | 'sponsorship'
  | 'food'
  | 'water'
  | 'clothing'
  | 'general';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  type: CampaignType;
  target_donors: number;
  current_donors: number;
  target_amount?: number;
  raised_amount?: number;
  cover_image_url?: string;
  video_url?: string;
  is_active: boolean;
  is_urgent: boolean;
  status: 'draft' | 'active' | 'completed' | 'archived';
  start_date: string;
  end_date?: string;
  created_at: string;
}

export type ProjectCategory =
  | 'food'
  | 'water'
  | 'clothing'
  | 'emergency_cash'
  | 'orphans'
  | 'widows'
  | 'children'
  | 'general';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  target_amount: number;
  raised_amount: number;
  beneficiaries_count?: number;
  location?: string;
  image_url?: string;
  video_url?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

export interface ImpactCard {
  id: string;
  title: string;
  story: string;
  project_id?: string;
  beneficiaries_count?: number;
  location?: string;
  image_url?: string;
  video_url?: string;
  completed_date?: string;
  published: boolean;
  created_at: string;
}

export type ReminderType = 'quran' | 'hadith' | 'dua' | 'motivation' | 'friday' | 'sadaqah';
export type ReminderStatus = 'draft' | 'approved' | 'published' | 'archived';

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  arabic_text?: string;
  text: string;
  translation?: string;
  explanation?: string;
  source_reference?: string;
  image_url?: string;
  scheduled_date?: string;
  status: ReminderStatus;
  created_at: string;
}

export interface Collector {
  id: string;
  user_id: string;
  collector_code: string;
  name: string;
  phone: string;
  country: string;
  total_registered: number;
  contributed_this_month: number;
  pending_this_month: number;
  created_at: string;
}

export interface CollectorMember {
  id: string;
  donor_id: string;
  display_name: string;
  pledge_status: PledgeStatus;
  joined_at: string;
}

export type NamlefContentType = 'video' | 'audio' | 'text' | 'link';

export interface NamlefContent {
  id: string;
  speaker_name: string;
  speaker_role?: string;
  content_type: NamlefContentType;
  title: string;
  description?: string;
  url?: string;
  thumbnail_url?: string;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
}

export type NotificationAudience =
  | 'all_users'
  | 'pending_donors'
  | 'confirmed_donors'
  | 'collectors'
  | 'admins';

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  audience: NotificationAudience;
  sent_count?: number;
  sent_at: string;
  sent_by: string;
}

export interface DashboardStats {
  total_donors: number;
  active_pledges: number;
  contributions_this_month: number;
  pending_contributions: number;
  total_raised_tracked: number;
  active_campaigns: number;
  collectors_count: number;
  recent_activity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'contribution' | 'donor' | 'campaign' | 'reminder';
  message: string;
  timestamp: string;
}

export type AiDraftType =
  | 'reminder'
  | 'impact_update'
  | 'weekly_summary'
  | 'collector_message'
  | 'friday_challenge'
  | 'emergency_appeal'
  | 'social_caption';

export type AiDraftStatus = 'draft' | 'approved' | 'rejected' | 'published';

export interface AiDraft {
  id: string;
  admin_id: string;
  draft_type: AiDraftType;
  input_context: Record<string, unknown> | null;
  generated_text: string;
  status: AiDraftStatus;
  approved_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  payment_link: string;
  payment_instructions: string;
  org_contact_email: string;
  org_contact_phone: string;
  app_notice: string;
  privacy_policy_url: string;
  terms_url: string;
  payment_account_name?: string;
  payment_account_number?: string;
  payment_currency?: string;
  payment_bank_name?: string;
  payment_branch_name?: string;
  payment_swift_code?: string;
  payment_intermediary_bank?: string;
  payment_intermediary_swift_code?: string;
  payment_mpesa_paybill?: string;
  payment_bank_code?: string;
  payment_branch_code?: string;
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
