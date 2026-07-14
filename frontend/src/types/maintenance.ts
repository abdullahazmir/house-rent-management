export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

export interface MaintenanceRequest {
  _id: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  resolutionNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
