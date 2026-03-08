export interface Child {
  id: string;
  parent_id: string;
  name: string;
  birthdate: string;
  pin_hash: string;
  avatar_color: string;
  created_at: string;
}

export interface ActivityCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface Activity {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  points: number;
  sort_order: number;
  category?: ActivityCategory;
}

export interface ChildActivity {
  id: string;
  child_id: string;
  activity_id: string;
  is_active: boolean;
  activity?: Activity & { activity_categories?: ActivityCategory };
}

export interface ActivityLog {
  id: string;
  child_id: string;
  activity_id: string;
  completed_date: string;
  completed_at: string;
}

export interface DayPoints {
  date: string;
  points: number;
}

export interface ChildSession {
  childId: string;
  childName: string;
  parentId: string;
  avatarColor: string;
}
