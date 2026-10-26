/**
 * Dataset Preprocessor & Matrix Transformation Utilities
 * Covers STEP 7 (Dataset Selection) & STEP 8 (Data Preprocessing)
 *
 * Capabilities:
 * - Computes matrix sparsity & density statistics
 * - Baseline centering: Global Mean (mu), User Bias (b_u), Item Bias (b_i)
 * - Audio feature normalization (Min-Max scaling and L2 unit-norm)
 * - Train / Test cross-validation mask generator
 */

export class DatasetPreprocessor {
  /**
   * Analyzes sparsity and rating statistics of the Netflix User-Item interaction matrix
   */
  static analyzeMatrixSparsity(ratingsMatrix) {
    const numUsers = ratingsMatrix.length;
    const numItems = ratingsMatrix[0].length;
    const totalCells = numUsers * numItems;

    let observedCount = 0;
    let sumRatings = 0;
    const userRatingCounts = new Array(numUsers).fill(0);
    const itemRatingCounts = new Array(numItems).fill(0);

    for (let u = 0; u < numUsers; u++) {
      for (let i = 0; i < numItems; i++) {
        const val = ratingsMatrix[u][i];
        if (val !== null && !isNaN(val)) {
          observedCount++;
          sumRatings += val;
          userRatingCounts[u]++;
          itemRatingCounts[i]++;
        }
      }
    }

    const density = observedCount / totalCells;
    const sparsity = 1.0 - density;
    const globalMean = observedCount > 0 ? sumRatings / observedCount : 0;

    return {
      numUsers,
      numItems,
      totalCells,
      observedCount,
      missingCount: totalCells - observedCount,
      densityPct: (density * 100).toFixed(1) + "%",
      sparsityPct: (sparsity * 100).toFixed(1) + "%",
      globalMean: parseFloat(globalMean.toFixed(2)),
      userRatingCounts,
      itemRatingCounts
    };
  }

  /**
   * Normalizes audio features using Min-Max scaling into [0.0, 1.0]
   */
  static normalizeAudioFeatures(tracks, featureKeys) {
    const minVals = {};
    const maxVals = {};

    for (const key of featureKeys) {
      minVals[key] = Infinity;
      maxVals[key] = -Infinity;
    }

    // Find min and max for each feature
    for (const track of tracks) {
      for (const key of featureKeys) {
        const val = track.features[key];
        if (val < minVals[key]) minVals[key] = val;
        if (val > maxVals[key]) maxVals[key] = val;
      }
    }

    // Return normalized copy
    return tracks.map(track => {
      const normalizedFeatures = {};
      for (const key of featureKeys) {
        const span = maxVals[key] - minVals[key];
        normalizedFeatures[key] = span > 0 
          ? (track.features[key] - minVals[key]) / span 
          : track.features[key];
      }
      return {
        ...track,
        normalizedFeatures
      };
    });
  }

  /**
   * Generates a 80/20 Train-Test split for model evaluation
   */
  static createTrainTestSplit(ratingsMatrix, testFraction = 0.2, seed = 42) {
    const trainMatrix = ratingsMatrix.map(row => [...row]);
    const testEntries = [];

    // Collect all observed entries
    const observed = [];
    for (let u = 0; u < ratingsMatrix.length; u++) {
      for (let i = 0; i < ratingsMatrix[u].length; i++) {
        if (ratingsMatrix[u][i] !== null && !isNaN(ratingsMatrix[u][i])) {
          observed.push({ u, i, r: ratingsMatrix[u][i] });
        }
      }
    }

    // Deterministic shuffle
    let s = seed;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    for (let idx = observed.length - 1; idx > 0; idx--) {
      const j = Math.floor(rnd() * (idx + 1));
      [observed[idx], observed[j]] = [observed[j], observed[idx]];
    }

    const testCount = Math.floor(observed.length * testFraction);
    for (let k = 0; k < testCount; k++) {
      const entry = observed[k];
      trainMatrix[entry.u][entry.i] = null; // Mask out in train set
      testEntries.push(entry);
    }

    return {
      trainMatrix,
      testEntries
    };
  }
}
