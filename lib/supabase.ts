"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface KbugDatabase {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: { id?: string; name: string; created_at?: string };
        Update: { name?: string };
        Relationships: [];
      };
      drivers: {
        Row: {
          id: string;
          company_id: string;
          driver_id: string;
          name: string;
          cdl_number: string;
          status: "active" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          driver_id: string;
          name: string;
          cdl_number: string;
          status?: "active" | "inactive";
        };
        Update: {
          driver_id?: string;
          name?: string;
          cdl_number?: string;
          status?: "active" | "inactive";
        };
        Relationships: [];
      };
      draws: {
        Row: {
          id: string;
          company_id: string | null;
          company_name: string;
          operator: string;
          cycle: "Q1" | "Q2" | "Q3" | "Q4";
          year: number;
          test_type: "drug" | "alcohol" | "both";
          pool_size: number;
          required_drug: number;
          required_alcohol: number;
          seed_hex: string;
          pool_hash: string;
          algorithm_version: string;
          rate_drug: number;
          rate_alcohol: number;
          rate_citation: string;
          primary_selections: unknown;
          alternate_selections: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string | null;
          company_name: string;
          operator: string;
          cycle: "Q1" | "Q2" | "Q3" | "Q4";
          year: number;
          test_type: "drug" | "alcohol" | "both";
          pool_size: number;
          required_drug: number;
          required_alcohol: number;
          seed_hex: string;
          pool_hash: string;
          algorithm_version: string;
          rate_drug: number;
          rate_alcohol: number;
          rate_citation: string;
          primary_selections: unknown;
          alternate_selections: unknown;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type KbugSupabaseClient = SupabaseClient<KbugDatabase>;

let cached: KbugSupabaseClient | null = null;

export function supabaseEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabase(): KbugSupabaseClient | null {
  if (!supabaseEnabled()) return null;
  if (cached) return cached;
  cached = createClient<KbugDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application": "kbug-generator" } },
    },
  );
  return cached;
}
