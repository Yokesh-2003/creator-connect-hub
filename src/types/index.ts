export type Campaign = {
  id: string;
  created_at: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  platform: string;
  status: string;
  reward_type: string;
  reward_value: number;
  quote: string;
  budget: number;
  cpm_rate: number;
};