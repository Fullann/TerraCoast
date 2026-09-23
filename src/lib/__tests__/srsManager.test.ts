import { describe, it, expect, beforeEach } from "vitest";
import {
  loadDeck,
  saveDeck,
  addCardToSrs,
  addErrorsFromQuizToSrs,
  reviewCard,
  removeCardFromSrs,
  getSrsStats,
} from "../srsManager";

describe("srsManager Leitner engine", () => {
  const TEST_USER = "test_user_unit";

  beforeEach(() => {
    saveDeck([], TEST_USER);
  });

  it("adds new cards to Box 1 with nextReviewDate = today", () => {
    const added = addCardToSrs("FRA", "capital", TEST_USER);
    expect(added).toBe(true);

    // Duplicate add should return false
    const duplicate = addCardToSrs("FRA", "capital", TEST_USER);
    expect(duplicate).toBe(false);

    const deck = loadDeck(TEST_USER);
    expect(deck).toHaveLength(1);
    expect(deck[0].box).toBe(1);
    expect(deck[0].streak).toBe(0);
  });

  it("adds errors from quiz in bulk", () => {
    const count = addErrorsFromQuizToSrs(["JPN", "BRA", "CAN"], "capital", TEST_USER);
    expect(count).toBe(3);

    const deck = loadDeck(TEST_USER);
    expect(deck).toHaveLength(3);
  });

  it("moves card up on good or easy rating", () => {
    addCardToSrs("FRA", "capital", TEST_USER);
    const cardId = "FRA_capital";

    // Good rating: Box 1 -> Box 2
    const res1 = reviewCard(cardId, "good", TEST_USER);
    expect(res1).not.toBeNull();
    expect(res1?.updatedCard.box).toBe(2);
    expect(res1?.updatedCard.streak).toBe(1);

    // Easy rating: Box 2 -> Box 4
    const res2 = reviewCard(cardId, "easy", TEST_USER);
    expect(res2?.updatedCard.box).toBe(4);
    expect(res2?.updatedCard.streak).toBe(3);
  });

  it("resets card to Box 1 on 'again' rating", () => {
    addCardToSrs("FRA", "capital", TEST_USER);
    const cardId = "FRA_capital";

    reviewCard(cardId, "good", TEST_USER);
    reviewCard(cardId, "good", TEST_USER);
    expect(loadDeck(TEST_USER)[0].box).toBe(3);

    // Rating "again" drops it back to 1
    const resFailed = reviewCard(cardId, "again", TEST_USER);
    expect(resFailed?.updatedCard.box).toBe(1);
    expect(resFailed?.updatedCard.streak).toBe(0);
    expect(resFailed?.updatedCard.failures).toBe(1);
  });

  it("computes accurate SRS stats", () => {
    addCardToSrs("FRA", "capital", TEST_USER);
    addCardToSrs("DEU", "capital", TEST_USER);

    const stats = getSrsStats(TEST_USER);
    expect(stats.totalCards).toBe(2);
    expect(stats.dueToday).toBe(2);
    expect(stats.boxCounts[1]).toBe(2);
  });

  it("removes cards cleanly", () => {
    addCardToSrs("FRA", "capital", TEST_USER);
    expect(removeCardFromSrs("FRA_capital", TEST_USER)).toBe(true);
    expect(loadDeck(TEST_USER)).toHaveLength(0);
  });
});
