// server/__tests__/discovery.score.test.ts
import {
    scoreProject,
    inactivityPenalty,
    DEFAULT_WEIGHTS,
    weightsForMix,
  } from "../discovery/score";
  
  describe("Discovery scoring", () => {
    test("inactivity penalty scales by 24h periods", () => {
      const p = inactivityPenalty(48, 3);
      expect(p).toBeCloseTo(-6);
    });
  
    test("scoreProject combines signals and penalty", () => {
      const s = {
        velocityPerWeek: 5,
        xpGrowth: 20,
        reactions: 10,
        transparency: 1,
        inactivityHours: 24, // one day
      };
      const score = scoreProject(s, DEFAULT_WEIGHTS);
      // base = 5*2 + 20*1.5 + 10*0.5 + 1*1 = 10 + 30 + 5 + 1 = 46
      // penalty = -3
      expect(score).toBeCloseTo(43);
    });
  
    test("weightsForMix returns union-preserving weights", () => {
      const w = weightsForMix("blended");
      expect(w).toHaveProperty("velocity");
      expect(w).toHaveProperty("xpGrowth");
    });
  });
  