import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../database.types";

export interface CategoryItem {
  id?: string;
  name: string;
  label: string;
}

export interface DifficultyItem {
  id?: string;
  name: string;
  label: string;
  multiplier?: number;
  color?: string;
  level?: number;
}

export type QuizTypeItem = Database["public"]["Tables"]["quiz_types"]["Row"];

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("categories")
        .select("*")
        .order("label");
      if (error) throw error;
      return (data || []) as CategoryItem[];
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useDifficultiesQuery() {
  return useQuery({
    queryKey: ["difficulties"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("difficulties")
        .select("*")
        .order("multiplier");
      if (error) throw error;
      return (data || []) as DifficultyItem[];
    },
    staleTime: 1000 * 60 * 15,
  });
}

export function useQuizTypesQuery() {
  return useQuery({
    queryKey: ["quiz_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_types")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data || []) as QuizTypeItem[];
    },
    staleTime: 1000 * 60 * 15,
  });
}
