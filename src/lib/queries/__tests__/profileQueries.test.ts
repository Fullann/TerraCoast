import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminUpdateUserXp } from "../profileQueries";
import { supabase } from "../../supabase";

vi.mock("../../supabase", () => {
  const updateMock = vi.fn();
  const selectMock = vi.fn();
  const singleMock = vi.fn();
  const eqMock = vi.fn();

  eqMock.mockReturnValue({
    select: selectMock,
    single: singleMock,
  });
  selectMock.mockReturnValue({
    single: singleMock,
  });

  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

describe("profileQueries - adminUpdateUserXp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error if userId is missing", async () => {
    const res = await adminUpdateUserXp("", { xpDelta: 500 });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/manquant/);
  });

  it("correctly adds xpDelta, computes new level and monthly score, and updates Supabase", async () => {
    const mockUpdatedProfile = {
      id: "user-123",
      pseudo: "TerraExplorer",
      experience_points: 650,
      level: 7, // floor(650 / 100) + 1 = 7
      monthly_score: 350,
    };

    const singleMock = vi.fn().mockResolvedValue({
      data: mockUpdatedProfile,
      error: null,
    });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const eqMock = vi.fn().mockReturnValue({ select: selectMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

    (supabase.from as any).mockReturnValue({
      update: updateMock,
    });

    const res = await adminUpdateUserXp(
      "user-123",
      { xpDelta: 250 },
      {
        experience_points: 400,
        level: 5,
        monthly_score: 100,
      } as any
    );

    expect(res.success).toBe(true);
    expect(res.newXp).toBe(650);
    expect(res.newLevel).toBe(7);
    expect(res.xpDelta).toBe(250);
    expect(res.profile).toEqual(mockUpdatedProfile);

    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        experience_points: 650,
        level: 7,
        monthly_score: 350,
      })
    );
    expect(eqMock).toHaveBeenCalledWith("id", "user-123");
  });

  it("correctly sets exact XP with setXp and calculates level", async () => {
    const mockUpdatedProfile = {
      id: "user-456",
      pseudo: "CaptainWorld",
      experience_points: 1200,
      level: 13, // floor(1200 / 100) + 1 = 13
      monthly_score: 700,
    };

    const singleMock = vi.fn().mockResolvedValue({
      data: mockUpdatedProfile,
      error: null,
    });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const eqMock = vi.fn().mockReturnValue({ select: selectMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

    (supabase.from as any).mockReturnValue({
      update: updateMock,
    });

    const res = await adminUpdateUserXp(
      "user-456",
      { setXp: 1200 },
      {
        experience_points: 500,
        level: 6,
        monthly_score: 0,
      } as any
    );

    expect(res.success).toBe(true);
    expect(res.newXp).toBe(1200);
    expect(res.newLevel).toBe(13);
    expect(res.profile?.level).toBe(13);
  });
});
