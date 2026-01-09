"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const score_1 = require("../discovery/score");
describe("Discovery scoring", () => {
    test("inactivity penalty scales by 24h periods", () => {
        const p = (0, score_1.inactivityPenalty)(48, 3);
        expect(p).toBeCloseTo(-6);
    });
    test("scoreProject combines signals and penalty", () => {
        const s = {
            velocityPerWeek: 5,
            xpGrowth: 20,
            reactions: 10,
            transparency: 1,
            inactivityHours: 24,
        };
        const score = (0, score_1.scoreProject)(s, score_1.DEFAULT_WEIGHTS);
        expect(score).toBeCloseTo(43);
    });
    test("weightsForMix returns union-preserving weights", () => {
        const w = (0, score_1.weightsForMix)("blended");
        expect(w).toHaveProperty("velocity");
        expect(w).toHaveProperty("xpGrowth");
    });
});
//# sourceMappingURL=discovery.score.test.js.map