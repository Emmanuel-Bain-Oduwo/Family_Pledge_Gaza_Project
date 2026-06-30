import enum


class UserRole(str, enum.Enum):
    donor = "donor"
    admin = "admin"
    collector = "collector"
    super_admin = "super_admin"


class PledgeType(str, enum.Enum):
    monthly = "monthly"
    free_participant = "free_participant"


class PledgeStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    cancelled = "cancelled"


class ContributionStatus(str, enum.Enum):
    submitted = "submitted"
    confirmed = "confirmed"
    rejected = "rejected"
    needs_follow_up = "needs_follow_up"


class CampaignType(str, enum.Enum):
    monthly = "monthly"
    friday = "friday"
    emergency = "emergency"
    sponsorship = "sponsorship"
    food = "food"
    water = "water"
    clothing = "clothing"
    general = "general"


class CampaignStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    completed = "completed"
    archived = "archived"


class ProjectCategory(str, enum.Enum):
    food = "food"
    water = "water"
    clothing = "clothing"
    emergency_cash = "emergency_cash"
    orphans = "orphans"
    widows = "widows"
    children = "children"
    general = "general"


class ProjectStatus(str, enum.Enum):
    upcoming = "upcoming"
    active = "active"
    completed = "completed"
    archived = "archived"


class ReminderType(str, enum.Enum):
    quran = "quran"
    hadith = "hadith"
    dua = "dua"
    motivation = "motivation"
    friday = "friday"
    sadaqah = "sadaqah"


class ReminderStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    published = "published"
    archived = "archived"


class NotificationType(str, enum.Enum):
    pledge = "pledge"
    campaign = "campaign"
    emergency = "emergency"
    reminder = "reminder"
    impact = "impact"
    system = "system"


class NotificationAudience(str, enum.Enum):
    all_users = "all_users"
    pending_donors = "pending_donors"
    confirmed_donors = "confirmed_donors"
    collectors = "collectors"
    admins = "admins"


class NamlefContentType(str, enum.Enum):
    video = "video"
    audio = "audio"
    text = "text"
    link = "link"


class NamlefContentStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class AiDraftType(str, enum.Enum):
    reminder = "reminder"
    impact_update = "impact_update"
    friday_challenge = "friday_challenge"
    emergency_appeal = "emergency_appeal"
    weekly_summary = "weekly_summary"
    collector_message = "collector_message"
    social_caption = "social_caption"


class AiDraftStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    rejected = "rejected"
    published = "published"
