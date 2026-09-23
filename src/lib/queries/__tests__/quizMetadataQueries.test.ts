/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "../../supabase";
import {
  useCategoriesQuery,
  useDifficultiesQuery,
  useQuizTypesQuery,
} from "../quizMetadataQueries";

vi.mock("../../supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn((options) => options),
}));

describe("quizMetadataQueries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useCategoriesQuery", () => {
    it("configures queryKey and staleTime of 15 minutes", () => {
      const config: any = useCategoriesQuery();
      expect(config.queryKey).toEqual(["categories"]);
      expect(config.staleTime).toBe(15 * 60 * 1000);
    });

    it("fetches categories ordered by label", async () => {
      const mockCategories = [
        { id: "cat-1", name: "geo", label: "Géographie" },
        { id: "cat-2", name: "hist", label: "Histoire" },
      ];

      const orderMock = vi.fn().mockResolvedValue({ data: mockCategories, error: null });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      (supabase.from as any).mockReturnValue({ select: selectMock });

      const config: any = useCategoriesQuery();
      const result = await config.queryFn();

      expect(supabase.from).toHaveBeenCalledWith("categories");
      expect(selectMock).toHaveBeenCalledWith("*");
      expect(orderMock).toHaveBeenCalledWith("label");
      expect(result).toEqual(mockCategories);
    });

    it("throws an error when Supabase query fails", async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        error: new Error("Failed to load categories"),
      });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      (supabase.from as any).mockReturnValue({ select: selectMock });

      const config: any = useCategoriesQuery();
      await expect(config.queryFn()).rejects.toThrow("Failed to load categories");
    });
  });

  describe("useDifficultiesQuery", () => {
    it("configures queryKey and staleTime of 15 minutes", () => {
      const config: any = useDifficultiesQuery();
      expect(config.queryKey).toEqual(["difficulties"]);
      expect(config.staleTime).toBe(15 * 60 * 1000);
    });

    it("fetches difficulties ordered by multiplier", async () => {
      const mockDifficulties = [
        { id: "dif-1", name: "easy", label: "Facile", multiplier: 1 },
        { id: "dif-2", name: "hard", label: "Difficile", multiplier: 2 },
      ];

      const orderMock = vi.fn().mockResolvedValue({ data: mockDifficulties, error: null });
      const selectMock = vi.fn().mockReturnValue({ order: orderMock });
      (supabase.from as any).mockReturnValue({ select: selectMock });

      const config: any = useDifficultiesQuery();
      const result = await config.queryFn();

      expect(supabase.from).toHaveBeenCalledWith("difficulties");
      expect(selectMock).toHaveBeenCalledWith("*");
      expect(orderMock).toHaveBeenCalledWith("multiplier");
      expect(result).toEqual(mockDifficulties);
    });
  });

  describe("useQuizTypesQuery", () => {
    it("fetches active quiz types ordered by name", async () => {
      const mockTypes = [
        { id: "type-1", name: "mcq", label: "QCM", is_active: true },
      ];

      const orderMock = vi.fn().mockResolvedValue({ data: mockTypes, error: null });
      const eqMock = vi.fn().mockReturnValue({ order: orderMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as any).mockReturnValue({ select: selectMock });

      const config: any = useQuizTypesQuery();
      const result = await config.queryFn();

      expect(supabase.from).toHaveBeenCalledWith("quiz_types");
      expect(selectMock).toHaveBeenCalledWith("*");
      expect(eqMock).toHaveBeenCalledWith("is_active", true);
      expect(orderMock).toHaveBeenCalledWith("name");
      expect(result).toEqual(mockTypes);
    });
  });
});
