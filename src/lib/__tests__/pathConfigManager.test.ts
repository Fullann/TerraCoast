import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAllPathAssignments,
  setPathAssignment,
  removePathAssignment,
  resetAllPathAssignments,
  getCustomUnits,
  saveCustomUnit,
  deleteCustomUnit,
  addStageToUnit,
  removeStageFromUnit,
  resetCustomUnits,
  resetPathConfigMemory,
  PathUnit,
  PathNode,
} from "../pathConfigManager";
import { getQuestPath, DEFAULT_BASE_UNITS } from "../gamificationManager";

describe("pathConfigManager", () => {
  beforeEach(() => {
    resetPathConfigMemory();
    vi.restoreAllMocks();
  });

  it("should assign and remove quiz on a path node", () => {
    setPathAssignment("u1-n1", {
      quizId: "quiz-custom-123",
      quizTitle: "Mon Quiz Personnalisé",
      category: "continents",
      difficulty: "facile",
    });

    const all = getAllPathAssignments();
    expect(all["u1-n1"]).toBeDefined();
    expect(all["u1-n1"].quizId).toBe("quiz-custom-123");
    expect(all["u1-n1"].quizTitle).toBe("Mon Quiz Personnalisé");

    removePathAssignment("u1-n1");
    expect(getAllPathAssignments()["u1-n1"]).toBeUndefined();
  });

  it("should reset all path assignments", () => {
    setPathAssignment("u1-n1", { quizId: "q1", quizTitle: "T1" });
    setPathAssignment("u2-n2", { quizId: "q2", quizTitle: "T2" });

    expect(Object.keys(getAllPathAssignments()).length).toBe(2);
    resetAllPathAssignments();
    expect(Object.keys(getAllPathAssignments()).length).toBe(0);
  });

  it("should create, save and delete custom units", () => {
    const newUnit: PathUnit = {
      id: "unit-5",
      unitNumber: 5,
      title: "Volcans & Forces Telluriques",
      description: "Explorez la Ceinture de feu du Pacifique",
      themeColor: "amber",
      badgeIcon: "🌋",
      nodes: [
        {
          id: "u5-n1",
          title: "Introduction aux Volcans",
          subtitle: "Magma et Caldeiras",
          category: "volcans",
          xpReward: 30,
          gemReward: 15,
          stars: 0,
          status: "locked",
        },
      ],
      chest: {
        id: "u5-chest",
        title: "Coffre des Volcans",
        gemReward: 60,
        xpReward: 40,
        claimed: false,
        unlocked: false,
      },
    };

    saveCustomUnit(newUnit);
    const customList = getCustomUnits();
    expect(customList.length).toBe(1);
    expect(customList[0].id).toBe("unit-5");
    expect(customList[0].title).toBe("Volcans & Forces Telluriques");

    // Add stage to custom unit
    const extraStage: PathNode = {
      id: "u5-n2",
      title: "Supervolcans",
      subtitle: "Yellowstone & Toba",
      category: "volcans",
      xpReward: 40,
      gemReward: 20,
      stars: 0,
      status: "locked",
    };

    addStageToUnit("unit-5", extraStage, DEFAULT_BASE_UNITS);
    const updatedCustom = getCustomUnits();
    expect(updatedCustom[0].nodes.length).toBe(2);

    // Remove stage
    removeStageFromUnit("unit-5", "u5-n2", DEFAULT_BASE_UNITS);
    expect(getCustomUnits()[0].nodes.length).toBe(1);

    // Delete custom unit
    deleteCustomUnit("unit-5");
    expect(getCustomUnits().length).toBe(0);
  });

  it("should integrate custom units dynamically into getQuestPath", () => {
    const customUnit: PathUnit = {
      id: "unit-5",
      unitNumber: 5,
      title: "Les Fleuves Sacrés",
      description: "Nil, Amazone, Gange",
      themeColor: "teal",
      badgeIcon: "🌊",
      nodes: [
        {
          id: "u5-n1",
          title: "Le Nil",
          subtitle: "Source de civilisation",
          category: "fleuves",
          xpReward: 35,
          gemReward: 15,
          stars: 0,
          status: "locked",
        },
      ],
      chest: {
        id: "u5-chest",
        title: "Trésor du Nil",
        gemReward: 50,
        xpReward: 30,
        claimed: false,
        unlocked: false,
      },
    };

    saveCustomUnit(customUnit);

    const path = getQuestPath();
    expect(path.length).toBe(5); // 4 default units + 1 custom unit
    expect(path[4].id).toBe("unit-5");
    expect(path[4].unitNumber).toBe(5);
    expect(path[4].nodes[0].title).toBe("Le Nil");

    // Resetting custom units restores original 4 units
    resetCustomUnits();
    expect(getQuestPath().length).toBe(4);
  });
});
