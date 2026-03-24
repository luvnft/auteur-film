export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'none';
export type ContentType = 'film' | 'episode';
export type UploadStatus = 'draft' | 'uploading_youtube' | 'processing' | 'ready' | 'failed';
export type ContentStatus = 'published' | 'removed_dmca' | 'removed_creator' | 'under_review';
export type AccountStatus = 'active' | 'suspended' | 'banned';
export type DMCAReportReason = 'copyright' | 'publicity' | 'other';
export type DMCAReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';

export interface User {
  id: string;
  privy_id: string;
  wallet_address: string | null;
  email: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean;
  is_admin: boolean;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  referral_code: string;
  referred_by: string | null;
  strike_count: number;
  account_status: AccountStatus;
  created_at: string;
}

export interface Series {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  tags: string[];
  created_at: string;
}

export interface Content {
  id: string;
  creator_id: string;
  type: ContentType;
  series_id: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  youtube_video_id: string | null;
  release_notes: string | null;
  duration_seconds: number | null;
  season_number: number | null;
  episode_number: number | null;
  tags: string[];
  view_count: number;
  tip_total_cents: number;
  published_at: string | null;
  created_at: string;
  // Upload status fields
  upload_status: UploadStatus;
  upload_error: string | null;
  // Content moderation status
  content_status: ContentStatus;
  // Pay-per-content fields
  price_cents: number;  // 0 = free, 1-2500 = $0.01-$25.00
  release_date: string | null;  // null = immediate, future = pre-release
  trailer_youtube_id: string | null;  // trailer for pre-release content
  // Joined fields
  creator?: User;
  series?: Series;
}

export interface ContentView {
  id: string;
  user_id: string;
  content_id: string;
  completed: boolean;
  watch_time_seconds: number;
  created_at: string;
}

export interface Tip {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content_id: string;
  amount_cents: number;
  transaction_hash: string;
  created_at: string;
}

export interface ContentPurchase {
  id: string;
  user_id: string;
  content_id: string;
  amount_cents: number;
  platform_fee_cents: number;
  transaction_hash: string | null;
  created_at: string;
  // Joined fields
  content?: Content;
  user?: User;
}

export interface Comment {
  id: string;
  content_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  upvotes: number;
  downvotes: number;
  is_pinned: boolean;
  created_at: string;
  // Joined fields
  user?: User;
  replies?: Comment[];
}

export interface CommentVote {
  user_id: string;
  comment_id: string;
  vote: 1 | -1;
}

export interface UserPin {
  user_id: string;
  content_id: string;
  position: 1 | 2 | 3 | 4 | 5;
  created_at: string;
  // Joined fields
  content?: Content;
}

export interface LeaderboardScore {
  user_id: string;
  content_id: string;
  score: number;
  breakdown: {
    views: number;
    tips: number;
    pin: number;
    comments: number;
    referrals: number;
  };
  updated_at: string;
  // Joined fields
  user?: User;
}

export interface ReferralClick {
  id: string;
  referrer_id: string;
  content_id: string | null;
  visitor_fingerprint: string;
  converted_user_id: string | null;
  created_at: string;
}

export interface DMCAReport {
  id: string;
  content_id: string;
  content_type: ContentType;
  reporter_email: string;
  reason: DMCAReportReason;
  description: string;
  original_work_url: string | null;
  status: DMCAReportStatus;
  admin_notes: string | null;
  actioned_at: string | null;
  actioned_by: string | null;
  created_at: string;
  // Joined fields
  content?: Content;
  actioned_by_user?: User;
}

export interface UserStrike {
  id: string;
  user_id: string;
  content_id: string | null;
  dmca_report_id: string | null;
  reason: string;
  strike_number: number;
  created_at: string;
  // Joined fields
  user?: User;
  content?: Content;
  dmca_report?: DMCAReport;
}

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'referral_code'> & {
          id?: string;
          created_at?: string;
          referral_code?: string;
        };
        Update: Partial<Omit<User, 'id'>>;
      };
      series: {
        Row: Series;
        Insert: Omit<Series, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Series, 'id'>>;
      };
      content: {
        Row: Content;
        Insert: Omit<Content, 'id' | 'created_at' | 'view_count' | 'tip_total_cents'> & {
          id?: string;
          created_at?: string;
          view_count?: number;
          tip_total_cents?: number;
        };
        Update: Partial<Omit<Content, 'id'>>;
      };
      content_views: {
        Row: ContentView;
        Insert: Omit<ContentView, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ContentView, 'id'>>;
      };
      tips: {
        Row: Tip;
        Insert: Omit<Tip, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Tip, 'id'>>;
      };
      content_purchases: {
        Row: ContentPurchase;
        Insert: Omit<ContentPurchase, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ContentPurchase, 'id'>>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at' | 'upvotes' | 'downvotes'> & {
          id?: string;
          created_at?: string;
          upvotes?: number;
          downvotes?: number;
        };
        Update: Partial<Omit<Comment, 'id'>>;
      };
      comment_votes: {
        Row: CommentVote;
        Insert: CommentVote;
        Update: Partial<CommentVote>;
      };
      user_pins: {
        Row: UserPin;
        Insert: Omit<UserPin, 'created_at'> & { created_at?: string };
        Update: Partial<UserPin>;
      };
      leaderboard_scores: {
        Row: LeaderboardScore;
        Insert: Omit<LeaderboardScore, 'updated_at'> & { updated_at?: string };
        Update: Partial<LeaderboardScore>;
      };
      referral_clicks: {
        Row: ReferralClick;
        Insert: Omit<ReferralClick, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ReferralClick, 'id'>>;
      };
      dmca_reports: {
        Row: DMCAReport;
        Insert: Omit<DMCAReport, 'id' | 'created_at' | 'status'> & {
          id?: string;
          created_at?: string;
          status?: DMCAReportStatus;
        };
        Update: Partial<Omit<DMCAReport, 'id'>>;
      };
      user_strikes: {
        Row: UserStrike;
        Insert: Omit<UserStrike, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<UserStrike, 'id'>>;
      };
    };
  };
}
