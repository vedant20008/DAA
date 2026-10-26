/**
 * Contextual Multi-Armed Bandit Algorithms for Netflix Dynamic Artwork Personalization
 *
 * Problem Formulation:
 * A movie M has K artwork variations (thumbnails).
 * Different user segments have different true Click-Through Rates (CTR) mu_k for each thumbnail.
 * The recommendation system must balance Exploration (showing untested artwork)
 * and Exploitation (showing the highest-converting artwork).
 *
 * DAA Theoretical Complexity:
 * - Update Time: O(K) per user impression
 * - Space Complexity: O(K) state counters
 * - Regret Bounds:
 *   - Pure Random / Static: O(T) Linear Regret (unbounded loss)
 *   - Epsilon-Greedy: O(T * epsilon) Linear asymptotic regret
 *   - UCB1 (Upper Confidence Bound): O(log T) Logarithmic Regret (asymptotically optimal by Lai & Robbins theorem!)
 */

export class ArtworkBanditSimulator {
  constructor(variants, trueCtrs) {
    this.variants = variants; // Array of artwork objects
    this.trueCtrs = trueCtrs; // Ground-truth CTR probability for each arm
    this.K = variants.length;
    this.optimalArm = this.trueCtrs.indexOf(Math.max(...this.trueCtrs));
    this.optimalCtr = this.trueCtrs[this.optimalArm];

    this.reset();
  }

  reset() {
    this.totalImpressions = 0;
    this.totalClicks = 0;
    this.cumulativeRegret = 0;

    // Per-arm statistics
    this.pullCounts = new Array(this.K).fill(0);
    this.clickCounts = new Array(this.K).fill(0);
    this.estimatedCtrs = new Array(this.K).fill(0);

    // Beta distribution parameters for Thompson Sampling (Bayesian)
    this.alpha = new Array(this.K).fill(1); // Prior successes
    this.beta = new Array(this.K).fill(1);  // Prior failures

    // History tracking for real-time charting
    this.history = {
      timesteps: [],
      cumulativeClicks: [],
      cumulativeRegret: [],
      ctrHistory: [],
      armPulls: Array.from({ length: this.K }, () => [])
    };
  }

  /**
   * Selects an arm according to chosen algorithm
   */
  selectArm(strategy = "ucb1", param = 0.15) {
    // Warmup: Pull each arm at least once
    for (let k = 0; k < this.K; k++) {
      if (this.pullCounts[k] === 0) return k;
    }

    if (strategy === "random") {
      return Math.floor(Math.random() * this.K);
    }

    if (strategy === "epsilon-greedy") {
      // With prob epsilon, explore random arm
      if (Math.random() < param) {
        return Math.floor(Math.random() * this.K);
      }
      // With prob 1 - epsilon, exploit best known mean
      let bestArm = 0;
      let maxMean = -Infinity;
      for (let k = 0; k < this.K; k++) {
        if (this.estimatedCtrs[k] > maxMean) {
          maxMean = this.estimatedCtrs[k];
          bestArm = k;
        }
      }
      return bestArm;
    }

    if (strategy === "ucb1") {
      // UCB1 formula: hat{mu}_k + c * sqrt((2 * ln T) / n_k)
      const c = param || 1.0; // Exploration coefficient
      const T = this.totalImpressions;
      let bestArm = 0;
      let maxUcb = -Infinity;

      for (let k = 0; k < this.K; k++) {
        const exploitation = this.estimatedCtrs[k];
        const exploration = c * Math.sqrt((2 * Math.log(T)) / this.pullCounts[k]);
        const ucb = exploitation + exploration;

        if (ucb > maxUcb) {
          maxUcb = ucb;
          bestArm = k;
        }
      }
      return bestArm;
    }

    if (strategy === "thompson") {
      // Thompson Sampling: sample from Beta(alpha_k, beta_k)
      let bestArm = 0;
      let maxSample = -Infinity;

      for (let k = 0; k < this.K; k++) {
        const sample = this._sampleBeta(this.alpha[k], this.beta[k]);
        if (sample > maxSample) {
          maxSample = sample;
          bestArm = k;
        }
      }
      return bestArm;
    }

    return 0;
  }

  /**
   * Simulates an impression of the chosen arm and updates bandit state
   */
  step(strategy = "ucb1", param = 0.15) {
    const chosenArm = this.selectArm(strategy, param);
    const trueProb = this.trueCtrs[chosenArm];

    // Bernoulli trial: Did the user click the title?
    const click = Math.random() < trueProb ? 1 : 0;

    // Update state
    this.totalImpressions++;
    this.pullCounts[chosenArm]++;
    this.clickCounts[chosenArm] += click;
    this.totalClicks += click;
    this.estimatedCtrs[chosenArm] = this.clickCounts[chosenArm] / this.pullCounts[chosenArm];

    // Bayesian updates
    if (click === 1) {
      this.alpha[chosenArm]++;
    } else {
      this.beta[chosenArm]++;
    }

    // Regret computation: difference between optimal arm expected CTR and chosen arm expected CTR
    const instantRegret = this.optimalCtr - trueProb;
    this.cumulativeRegret += instantRegret;

    // Record history
    this.history.timesteps.push(this.totalImpressions);
    this.history.cumulativeClicks.push(this.totalClicks);
    this.history.cumulativeRegret.push(parseFloat(this.cumulativeRegret.toFixed(3)));
    this.history.ctrHistory.push(parseFloat((this.totalClicks / this.totalImpressions).toFixed(3)));

    for (let k = 0; k < this.K; k++) {
      this.history.armPulls[k].push(this.pullCounts[k]);
    }

    return {
      arm: chosenArm,
      click,
      instantRegret,
      cumulativeRegret: this.cumulativeRegret,
      overallCtr: this.totalClicks / this.totalImpressions
    };
  }

  /**
   * Runs a batch of N impressions
   */
  runBatch(numSteps = 100, strategy = "ucb1", param = 0.15) {
    for (let i = 0; i < numSteps; i++) {
      this.step(strategy, param);
    }
    return this.getState();
  }

  getState() {
    return {
      impressions: this.totalImpressions,
      clicks: this.totalClicks,
      overallCtr: this.totalImpressions > 0 ? (this.totalClicks / this.totalImpressions).toFixed(3) : 0,
      cumulativeRegret: this.cumulativeRegret.toFixed(2),
      pullCounts: [...this.pullCounts],
      estimatedCtrs: this.estimatedCtrs.map(c => c.toFixed(3)),
      trueCtrs: [...this.trueCtrs],
      optimalArm: this.optimalArm,
      optimalCtr: this.optimalCtr
    };
  }

  /**
   * Approximate Beta distribution sampler using Johnk's generator
   */
  _sampleBeta(a, b) {
    let u1, u2, x, y;
    do {
      u1 = Math.random();
      u2 = Math.random();
      x = Math.pow(u1, 1 / a);
      y = Math.pow(u2, 1 / b);
    } while (x + y > 1);
    return x / (x + y);
  }
}
