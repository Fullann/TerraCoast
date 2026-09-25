import { describe, it, expect } from "vitest";
import { getPathNodeQuiz } from "../pathQuizzesData";

describe("pathQuizzesData", () => {
  it("should provide quizzes for all initial path nodes", () => {
    const requiredNodes = [
      "u1-n1",
      "u1-n2",
      "u1-n3",
      "u1-boss",
      "u2-n1",
      "u2-n2",
      "u2-n3",
      "u2-boss",
    ];

    requiredNodes.forEach((nodeId) => {
      const bundle = getPathNodeQuiz(nodeId);
      expect(bundle).not.toBeNull();
      expect(bundle?.quiz.id).toBe(nodeId);
      expect(bundle?.questions.length).toBeGreaterThanOrEqual(5);

      bundle?.questions.forEach((q) => {
        expect(q.question_text).toBeTruthy();
        expect(q.correct_answer).toBeTruthy();
        expect(Array.isArray(q.options)).toBe(true);
        expect((q.options as string[]).includes(q.correct_answer)).toBe(true);
        expect(q.points).toBeGreaterThan(0);
      });
    });
  });

  it("should return a dynamic fallback for unknown nodes", () => {
    const fallback = getPathNodeQuiz("u99-boss");
    expect(fallback).not.toBeNull();
    expect(fallback?.quiz.id).toBe("u99-boss");
    expect(fallback?.questions.length).toBe(5);
  });
});
