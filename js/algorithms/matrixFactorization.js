/**
 * Collaborative Filtering: Matrix Factorization via Regularized Stochastic Gradient Descent (Funk SVD)
 * Designed for DAA Complexity Analysis and Live Interactive Step-by-Step Training.
 *
 * DAA Theoretical Complexity:
 * - Time per Epoch: O(|R_observed| * K) where |R_observed| is count of non-null ratings and K is latent factor rank.
 * - Overall Training Time: O(E * |R_observed| * K) for E epochs.
 *   Compared to Exact SVD via LAPACK/Lanczos: O(min(U * I^2, U^2 * I)), Funk SVD is far superior on sparse matrices!
 * - Space Complexity: O((U + I) * K) for factor storage + O(U + I) for biases.
 * - Single Query Time: O(K) dot product.
 */

export class MatrixFactorization {
  constructor(options = {}) {
    this.K = options.K || 3;             // Latent factor dimensions
    this.lr = options.lr || 0.05;         // Learning rate (gamma)
    this.lambda = options.lambda || 0.02; // Regularization parameter
    this.epochsRun = 0;
    this.lossHistory = [];
    this.isInitialized = false;

    // Model parameters
    this.mu = 0;                          // Global rating average
    this.bu = [];                         // User biases [U]
    this.bi = [];                         // Item biases [I]
    this.P = [];                          // User latent factors [U x K]
    this.Q = [];                          // Item latent factors [I x K]
    this.numUsers = 0;
    this.numItems = 0;
    this.observedCount = 0;
  }

  /**
   * Initializes latent factor matrices P and Q with small random values
   * Computes baseline global mean mu
   */
  initialize(ratingsMatrix, K = this.K) {
    this.K = K;
    this.numUsers = ratingsMatrix.length;
    this.numItems = ratingsMatrix[0].length;
    this.epochsRun = 0;
    this.lossHistory = [];

    let totalSum = 0;
    let count = 0;

    for (let u = 0; u < this.numUsers; u++) {
      for (let i = 0; i < this.numItems; i++) {
        if (ratingsMatrix[u][i] !== null && !isNaN(ratingsMatrix[u][i])) {
          totalSum += ratingsMatrix[u][i];
          count++;
        }
      }
    }

    this.observedCount = count;
    this.mu = count > 0 ? totalSum / count : 3.0;

    this.bu = new Array(this.numUsers).fill(0);
    this.bi = new Array(this.numItems).fill(0);

    // Deterministic pseudo-random seed initialization for repeatable visualization
    let seed = 42;
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return (seed / 233280 - 0.5) * 0.2; // values in range [-0.1, 0.1]
    };

    this.P = Array.from({ length: this.numUsers }, () =>
      Array.from({ length: this.K }, () => pseudoRandom())
    );

    this.Q = Array.from({ length: this.numItems }, () =>
      Array.from({ length: this.K }, () => pseudoRandom())
    );

    this.isInitialized = true;
    const initialRmse = this.computeRMSE(ratingsMatrix);
    this.lossHistory.push({ epoch: 0, rmse: initialRmse });
    return initialRmse;
  }

  /**
   * Predicts rating for user u and item i:
   * r_hat_{ui} = mu + b_u + b_i + dot_product(P_u, Q_i)
   */
  predict(u, i) {
    if (!this.isInitialized) return 3.0;
    let dot = 0;
    for (let k = 0; k < this.K; k++) {
      dot += this.P[u][k] * this.Q[i][k];
    }
    const raw = this.mu + this.bu[u] + this.bi[i] + dot;
    // Bound predictions to standard 1.0 - 5.0 rating scale
    return Math.max(1.0, Math.min(5.0, raw));
  }

  /**
   * Performs 1 Epoch of Stochastic Gradient Descent (SGD)
   * Iterates through all observed entries in random order
   */
  stepEpoch(ratingsMatrix) {
    if (!this.isInitialized) {
      this.initialize(ratingsMatrix);
    }

    // Collect all observed rating coordinates
    const observed = [];
    for (let u = 0; u < this.numUsers; u++) {
      for (let i = 0; i < this.numItems; i++) {
        if (ratingsMatrix[u][i] !== null && !isNaN(ratingsMatrix[u][i])) {
          observed.push({ u, i, r: ratingsMatrix[u][i] });
        }
      }
    }

    // Shuffle observed list for SGD stochasticity (Fisher-Yates)
    for (let idx = observed.length - 1; idx > 0; idx--) {
      const j = Math.floor(Math.random() * (idx + 1));
      [observed[idx], observed[j]] = [observed[j], observed[idx]];
    }

    // SGD Parameter updates
    for (const { u, i, r } of observed) {
      const rHat = this.predict(u, i);
      const err = r - rHat;

      // Update biases
      this.bu[u] += this.lr * (err - this.lambda * this.bu[u]);
      this.bi[i] += this.lr * (err - this.lambda * this.bi[i]);

      // Update latent vectors
      for (let k = 0; k < this.K; k++) {
        const p_uk = this.P[u][k];
        const q_ik = this.Q[i][k];

        this.P[u][k] += this.lr * (err * q_ik - this.lambda * p_uk);
        this.Q[i][k] += this.lr * (err * p_uk - this.lambda * q_ik);
      }
    }

    this.epochsRun++;
    const currentRmse = this.computeRMSE(ratingsMatrix);
    this.lossHistory.push({ epoch: this.epochsRun, rmse: currentRmse });
    return currentRmse;
  }

  /**
   * Runs multiple epochs synchronously
   */
  train(ratingsMatrix, epochs = 20) {
    for (let e = 0; e < epochs; e++) {
      this.stepEpoch(ratingsMatrix);
    }
    return this.lossHistory[this.lossHistory.length - 1].rmse;
  }

  /**
   * Computes Root Mean Squared Error (RMSE) on observed ratings
   */
  computeRMSE(ratingsMatrix) {
    let sumSqErr = 0;
    let count = 0;
    for (let u = 0; u < this.numUsers; u++) {
      for (let i = 0; i < this.numItems; i++) {
        const actual = ratingsMatrix[u][i];
        if (actual !== null && !isNaN(actual)) {
          const pred = this.predict(u, i);
          sumSqErr += (actual - pred) * (actual - pred);
          count++;
        }
      }
    }
    return count === 0 ? 0 : Math.sqrt(sumSqErr / count);
  }

  /**
   * Generates complete matrix containing both actual ratings and predictions for null cells
   */
  getReconstructedMatrix(ratingsMatrix) {
    const result = [];
    for (let u = 0; u < this.numUsers; u++) {
      const row = [];
      for (let i = 0; i < this.numItems; i++) {
        const actual = ratingsMatrix[u][i];
        const predicted = this.predict(u, i);
        row.push({
          u,
          i,
          isObserved: actual !== null && !isNaN(actual),
          actual: actual,
          predicted: parseFloat(predicted.toFixed(2)),
          diff: actual !== null ? parseFloat(Math.abs(actual - predicted).toFixed(2)) : null
        });
      }
      result.push(row);
    }
    return result;
  }

  /**
   * Returns formal DAA complexity analysis metrics
   */
  getDAAComplexity() {
    return {
      trainingTime: `O(E · |R_obs| · K) = O(${this.epochsRun} · ${this.observedCount} · ${this.K}) = ${this.epochsRun * this.observedCount * this.K} ops`,
      exactSvdComparison: `Exact SVD: O(min(U·I², U²·I)) = O(${Math.min(this.numUsers * this.numItems * this.numItems, this.numUsers * this.numUsers * this.numItems)}) ops (Infeasible on Netflix scale: 200M users x 15k titles!)`,
      spaceComplexity: `O((U + I) · K) = O((${this.numUsers} + ${this.numItems}) · ${this.K}) = ${(this.numUsers + this.numItems) * this.K} floats`,
      denseMatrixSpace: `Dense Matrix: O(U · I) = ${this.numUsers * this.numItems} floats (99.5%+ memory waste on real Netflix sparsity)`,
      queryLatency: `O(K) dot product per recommendation = ${this.K} multiplications`
    };
  }
}
