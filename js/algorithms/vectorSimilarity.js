/**
 * Vector Similarity & Nearest Neighbor Algorithms (Spotify Audio Engine)
 * Implements:
 * 1. Cosine Similarity & Euclidean Distance in D-dimensional feature space
 * 2. Brute-Force K-Nearest Neighbors (KNN) - Exact baseline
 * 3. Approximate Nearest Neighbor (Spotify Annoy - Random Projection Trees)
 *
 * DAA Theoretical Complexity:
 * - Brute-Force KNN:
 *   - Distance calculations: O(N · D)
 *   - Top-K Selection: O(N log K) with min-heap / priority queue
 *   - Total Query Time: O(N · D)
 *   - Space: O(N · D)
 * - Spotify Annoy Index (Random Projection Trees):
 *   - Index Construction: O(T · N log N) where T = number of trees
 *   - Index Storage: O(T · N)
 *   - Query Time: O(T · D log N) -> Sub-linear retrieval for Spotify's 100M+ track catalog!
 */

export class VectorMath {
  /**
   * Dot product of two D-dimensional vectors: u · v = sum(u_i * v_i)
   */
  static dot(u, v) {
    let sum = 0;
    for (let i = 0; i < u.length; i++) {
      sum += u[i] * v[i];
    }
    return sum;
  }

  /**
   * L2 Norm (Euclidean Length): ||u|| = sqrt(sum(u_i^2))
   */
  static norm(u) {
    let sum = 0;
    for (let i = 0; i < u.length; i++) {
      sum += u[i] * u[i];
    }
    return Math.sqrt(sum);
  }

  /**
   * Cosine Similarity: cos(theta) = (u · v) / (||u|| * ||v||)
   * In range [-1.0, 1.0], normalized to [0.0, 1.0] for audio features
   */
  static cosineSimilarity(u, v) {
    const dot = this.dot(u, v);
    const normU = this.norm(u);
    const normV = this.norm(v);
    if (normU === 0 || normV === 0) return 0;
    const raw = dot / (normU * normV);
    return Math.max(0, Math.min(1, (raw + 1) / 2)); // Normalized to [0, 1]
  }

  /**
   * Euclidean Distance: sqrt(sum((u_i - v_i)^2))
   */
  static euclideanDistance(u, v) {
    let sum = 0;
    for (let i = 0; i < u.length; i++) {
      const diff = u[i] - v[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }
}

/**
 * Brute-Force KNN Recommender
 */
export class BruteForceKNN {
  constructor(tracks, featureKeys) {
    this.tracks = tracks;
    this.featureKeys = featureKeys;
    this.D = featureKeys.length;
    this.N = tracks.length;
  }

  getFeatureVector(track) {
    return this.featureKeys.map(k => track.features[k] || 0);
  }

  /**
   * Finds top K most similar tracks to target vector
   * Returns matches and operation count for DAA benchmarking
   */
  findNearest(queryVector, k = 5, metric = "cosine") {
    let opCount = 0;
    const scored = [];

    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      const vec = this.getFeatureVector(track);

      let sim = 0;
      let dist = 0;

      if (metric === "cosine") {
        sim = VectorMath.cosineSimilarity(queryVector, vec);
        dist = 1 - sim;
        opCount += this.D * 3 + 4; // dot + 2 norms + division
      } else {
        dist = VectorMath.euclideanDistance(queryVector, vec);
        sim = 1 / (1 + dist);
        opCount += this.D * 3; // sub + mult + add
      }

      scored.push({
        track,
        similarity: sim,
        distance: dist,
        featureVector: vec
      });
    }

    // Top-K sorting (O(N log N) or O(N log K))
    scored.sort((a, b) => b.similarity - a.similarity);
    opCount += this.N * Math.log2(this.N);

    return {
      results: scored.slice(0, k),
      operations: Math.round(opCount),
      complexity: `O(N · D) = ${this.N} · ${this.D} = ${this.N * this.D} vector comparisons`
    };
  }
}

/**
 * Simulated Spotify Annoy (Approximate Nearest Neighbors Oh Yeah) Tree
 * Uses recursive random projection hyperplanes to partition the high-dimensional feature space
 */
export class AnnoyTreeIndex {
  constructor(tracks, featureKeys, numTrees = 3) {
    this.tracks = tracks;
    this.featureKeys = featureKeys;
    this.D = featureKeys.length;
    this.numTrees = numTrees;
    this.trees = [];
    this.build();
  }

  getFeatureVector(track) {
    return this.featureKeys.map(k => track.features[k] || 0);
  }

  build() {
    this.trees = [];
    for (let t = 0; t < this.numTrees; t++) {
      const allIndices = this.tracks.map((_, idx) => idx);
      const root = this._buildSubtree(allIndices, 0);
      this.trees.push(root);
    }
  }

  _buildSubtree(indices, depth) {
    if (indices.length <= 2 || depth > 8) {
      return { isLeaf: true, indices };
    }

    // Pick two random points to define a dividing hyperplane
    const idxA = indices[Math.floor(Math.random() * indices.length)];
    let idxB = indices[Math.floor(Math.random() * indices.length)];
    while (idxB === idxA && indices.length > 1) {
      idxB = indices[Math.floor(Math.random() * indices.length)];
    }

    const vecA = this.getFeatureVector(this.tracks[idxA]);
    const vecB = this.getFeatureVector(this.tracks[idxB]);

    // Normal vector perpendicular to the hyperplane connecting A and B
    const normal = [];
    let offset = 0;
    for (let d = 0; d < this.D; d++) {
      const diff = vecA[d] - vecB[d];
      normal.push(diff);
      offset += (vecA[d] + vecB[d]) / 2 * diff;
    }

    const left = [];
    const right = [];

    for (const idx of indices) {
      const v = this.getFeatureVector(this.tracks[idx]);
      const projection = VectorMath.dot(normal, v) - offset;
      if (projection > 0) {
        left.push(idx);
      } else {
        right.push(idx);
      }
    }

    // Edge case handling if points are collinear
    if (left.length === 0 || right.length === 0) {
      return { isLeaf: true, indices };
    }

    return {
      isLeaf: false,
      normal,
      offset,
      left: this._buildSubtree(left, depth + 1),
      right: this._buildSubtree(right, depth + 1)
    };
  }

  /**
   * Queries Annoy trees in O(T · log N) time
   */
  findNearest(queryVector, k = 5) {
    let opCount = 0;
    const candidateSet = new Set();

    // Traverse each random projection tree down to leaf
    for (const tree of this.trees) {
      let curr = tree;
      while (curr && !curr.isLeaf) {
        opCount += this.D * 2; // Dot product for hyperplane test
        const proj = VectorMath.dot(curr.normal, queryVector) - curr.offset;
        curr = proj > 0 ? curr.left : curr.right;
      }
      if (curr && curr.indices) {
        for (const idx of curr.indices) {
          candidateSet.add(idx);
        }
      }
    }

    // Score only candidates retrieved by trees
    const scored = [];
    for (const idx of candidateSet) {
      const track = this.tracks[idx];
      const vec = this.getFeatureVector(track);
      const sim = VectorMath.cosineSimilarity(queryVector, vec);
      opCount += this.D * 3;
      scored.push({
        track,
        similarity: sim,
        distance: 1 - sim,
        featureVector: vec
      });
    }

    scored.sort((a, b) => b.similarity - a.similarity);

    return {
      results: scored.slice(0, k),
      candidateCount: candidateSet.size,
      operations: opCount,
      complexity: `O(T · D · log N) = ${this.numTrees} trees · ${this.D} dims · log(${this.tracks.length})`
    };
  }
}
