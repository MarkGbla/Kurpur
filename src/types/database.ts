export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          privy_user_id: string;
          email: string | null;
          financial_score: number;
          baseline_cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          privy_user_id: string;
          email?: string | null;
          financial_score?: number;
          baseline_cost?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          privy_user_id?: string;
          email?: string | null;
          financial_score?: number;
          baseline_cost?: number;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          category: string;
          amount: number;
          note: string | null;
          status: string;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          category: string;
          amount: number;
          note?: string | null;
          status?: string;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          category?: string;
          amount?: number;
          note?: string | null;
          status?: string;
          timestamp?: string;
        };
      };
      savings_ledger: {
        Row: {
          id: string;
          user_id: string;
          virtual_balance: number;
          batch_threshold: number;
          transfer_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          virtual_balance?: number;
          batch_threshold?: number;
          transfer_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          virtual_balance?: number;
          batch_threshold?: number;
          transfer_status?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type SavingsLedger = Database["public"]["Tables"]["savings_ledger"]["Row"];
