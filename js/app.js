/**
 * StreamPulse: Main Application Controller & State Manager
 * Connects all 15 steps of the DAA Recommendation Systems Project
 */

import { MOVIES, USER_NAMES, INITIAL_RATINGS } from "./data/movies.js";
import { TRACKS, AUDIO_FEATURE_KEYS } from "./data/tracks.js";
import { DatasetPreprocessor } from "./data/datasetPreprocessor.js";
import { MatrixFactorization } from "./algorithms/matrixFactorization.js";
import { VectorMath, BruteForceKNN, AnnoyTreeIndex } from "./algorithms/vectorSimilarity.js";
import { ArtworkBanditSimulator } from "./algorithms/bandit.js";
import { HybridEngine } from "./algorithms/hybridEngine.js";
import { MinHeapTopK, DAABenchmarkSuite } from "./algorithms/daaAlgorithms.js";
import { MatrixVisualizer } from "./visualizers/matrixCanvas.js";
import { VectorSpaceVisualizer } from "./visualizers/vectorSpaceCanvas.js";
import { BanditVisualizer } from "./visualizers/banditChart.js";

class App {
  constructor() {
    // Application State
    this.activeTab = "feed";
    this.feedPlatform = "netflix"; // 'netflix' | 'spotify'

    // Data Clones
    this.ratingsMatrix = INITIAL_RATINGS.map(row => [...row]);
    this.currentUser = {
      index: 0,
      name: USER_NAMES[0],
      ratings: this.ratingsMatrix[0],
      genreTasteVector: [0.9, 0.4, 0.7, 0.2, 0.3, 0.8] // [Sci-Fi, Horror, Drama, Comedy, Romance, Action]
    };

    // Initialize Models
    this.mfModel = new MatrixFactorization({ K: 3, lr: 0.05, lambda: 0.02 });
    this.mfModel.initialize(this.ratingsMatrix);

    this.hybridEngine = new HybridEngine();

    this.knnEngine = new BruteForceKNN(TRACKS, AUDIO_FEATURE_KEYS);
    this.annoyIndex = new AnnoyTreeIndex(TRACKS, AUDIO_FEATURE_KEYS, 3);

    // Bandit Simulator for Stranger Things artwork variants
    const stVariants = MOVIES[0].artworkVariants;
    const stTrueCtrs = stVariants.map(v => v.baseCtr);
    this.banditSim = new ArtworkBanditSimulator(stVariants, stTrueCtrs);

    // Visualizers
    this.matrixVis = null;
    this.vectorVis = null;
    this.banditVis = null;

    // Viva Defense Presentation State
    this.currentVivaSlide = 0;
    this.vivaSlides = this._getVivaSlideData();
  }

  init() {
    this._initVisualizers();
    this._initNavigation();
    this._initFeedControls();
    this._initMatrixControls();
    this._initVectorControls();
    this._initBanditControls();
    this._initVivaDefense();

    // Initial render pass
    this.renderFeed();
    this.renderMatrixLab();
    this.renderVectorLab();
    this.renderBanditLab();
  }

  /* ========================================================================
     Visualizers Initialization
     ======================================================================== */

  _initVisualizers() {
    const movieTitles = MOVIES.map(m => m.title);
    this.matrixVis = new MatrixVisualizer(
      "matrixTableContainer",
      "lossCanvas",
      USER_NAMES,
      movieTitles
    );

    this.matrixVis.onCellSelect = (u, i, cellData, mf) => {
      this._inspectMatrixCell(u, i, cellData, mf);
    };

    this.vectorVis = new VectorSpaceVisualizer("vectorCanvas", TRACKS, AUDIO_FEATURE_KEYS);
    this.vectorVis.setAnnoyIndex(this.annoyIndex);
    this.vectorVis.onProbeChange = (newProbe) => {
      this._syncProbeInputs(newProbe);
      this._updateVectorRecommendations();
    };

    this.banditVis = new BanditVisualizer(
      "regretCanvas",
      "armCanvas",
      MOVIES[0].artworkVariants
    );
  }

  /* ========================================================================
     Navigation & Tab Switching
     ======================================================================== */

  _initNavigation() {
    const navTabs = document.querySelectorAll(".nav-tab-btn");
    navTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        navTabs.forEach(t => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");

        const targetTab = tab.getAttribute("data-tab");
        this.activeTab = targetTab;

        document.querySelectorAll(".tab-pane").forEach(pane => {
          pane.classList.remove("active");
        });

        const targetPane = document.getElementById(`pane-${targetTab}`);
        if (targetPane) {
          targetPane.classList.add("active");
        }

        // Trigger redraw on canvas elements when tab becomes visible
        if (targetTab === "matrix") this.renderMatrixLab();
        if (targetTab === "vector") this.renderVectorLab();
        if (targetTab === "bandit") this.renderBanditLab();
      });
    });
  }

  /* ========================================================================
     Tab 1: Live Feed Controls & Rendering
     ======================================================================== */

  _initFeedControls() {
    const btnNetflix = document.getElementById("btnPlatformNetflix");
    const btnSpotify = document.getElementById("btnPlatformSpotify");
    const netflixView = document.getElementById("netflixFeedView");
    const spotifyView = document.getElementById("spotifyFeedView");

    btnNetflix.addEventListener("click", () => {
      btnNetflix.classList.add("active");
      btnSpotify.classList.remove("active");
      netflixView.style.display = "block";
      spotifyView.style.display = "none";
      this.feedPlatform = "netflix";
      this.renderFeed();
    });

    btnSpotify.addEventListener("click", () => {
      btnSpotify.classList.add("active");
      btnNetflix.classList.remove("active");
      netflixView.style.display = "none";
      spotifyView.style.display = "block";
      this.feedPlatform = "spotify";
      this.renderFeed();
    });
  }

  renderFeed() {
    if (this.feedPlatform === "netflix") {
      this._renderNetflixFeed();
    } else {
      this._renderSpotifyFeed();
    }
  }

  _renderNetflixFeed() {
    const grid = document.getElementById("netflixMediaGrid");
    if (!grid) return;

    // Use Hybrid Engine to rank movies
    const { results } = this.hybridEngine.recommendMovies(
      this.currentUser,
      MOVIES,
      this.mfModel,
      8
    );

    let html = "";
    results.forEach(({ item, index, predictedRating, compositeScore, breakdown, reasons }) => {
      const currentRating = this.currentUser.ratings[index];
      const matchPct = Math.round(compositeScore * 100);

      // Artwork chosen dynamically by Bandit (or default hero)
      const selectedArtwork = (index === 0 && this.banditSim)
        ? this.banditSim.variants[this.banditSim.optimalArm]
        : null;

      const cardTitle = selectedArtwork ? `${item.title} (${selectedArtwork.name})` : item.title;

      html += `
        <article class="movie-card" data-movie-idx="${index}">
          <div class="movie-poster-header" style="background: ${item.posterGradients}; position: relative; overflow: hidden;">
            <img class="card-backdrop-img" src="${(selectedArtwork && selectedArtwork.image) ? selectedArtwork.image : item.image}" alt="${item.title}" loading="lazy" onerror="this.style.display='none'" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;">
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(13,17,26,0.85) 100%); z-index: 2; pointer-events: none;"></div>
            <span class="poster-duration" style="position: relative; z-index: 3;">${item.duration}</span>
            <span class="poster-match-badge" style="position: relative; z-index: 3;">${matchPct}% Match</span>
            <h3 class="movie-title-large" style="position: relative; z-index: 3;">${cardTitle}</h3>
          </div>

          <div class="movie-card-body">
            <div class="genre-tag-list">
              ${item.genres.map(g => `<span class="genre-pill">${g}</span>`).join("")}
            </div>

            <p class="movie-desc">${item.description}</p>

            <!-- Why Recommended Attribution Drawer -->
            <div class="attribution-box">
              <div class="attribution-header">
                <span>Why Recommended?</span>
                <span>SVD Pred: ${predictedRating}★</span>
              </div>
              <div class="attr-meter-bar" title="CF: ${breakdown.collaborativePct}% | Content: ${breakdown.contentPct}% | Pop: ${breakdown.popularityPct}%">
                <div class="attr-segment-cf" style="width: ${breakdown.collaborativePct}%"></div>
                <div class="attr-segment-content" style="width: ${breakdown.contentPct}%"></div>
                <div class="attr-segment-pop" style="width: ${breakdown.popularityPct}%"></div>
              </div>
              <div class="attr-legend">
                <span style="color: var(--netflix-red);">● CF ${breakdown.collaborativePct}%</span>
                <span style="color: var(--accent-cyan);">● Genre ${breakdown.contentPct}%</span>
                <span style="color: var(--accent-amber);">● Pop ${breakdown.popularityPct}%</span>
              </div>
              <div class="attr-reason-text">💡 ${reasons[0] || 'Personalized recommendation'}</div>
            </div>

            <!-- User Rating Star Controls -->
            <div class="card-action-bar">
              <span style="font-size: 0.78rem; color: var(--text-muted);">Your Rating:</span>
              <div class="rating-interaction">
                ${[1, 2, 3, 4, 5].map(star => `
                  <button class="btn-star ${currentRating >= star ? 'active' : ''}" 
                          data-movie-idx="${index}" data-val="${star}" title="Rate ${star} Stars">★</button>
                `).join("")}
              </div>
            </div>
          </div>
        </article>
      `;
    });

    grid.innerHTML = html;

    // Attach star rating interaction listeners
    grid.querySelectorAll(".btn-star").forEach(starBtn => {
      starBtn.addEventListener("click", (e) => {
        const mIdx = parseInt(starBtn.getAttribute("data-movie-idx"), 10);
        const val = parseFloat(starBtn.getAttribute("data-val"));

        // Update active user rating
        this.ratingsMatrix[0][mIdx] = val;
        this.currentUser.ratings[mIdx] = val;

        // Perform live incremental SGD update
        this.mfModel.stepEpoch(this.ratingsMatrix);

        // Re-render feed and matrix lab
        this._renderNetflixFeed();
        if (this.matrixVis) {
          const reconstructed = this.mfModel.getReconstructedMatrix(this.ratingsMatrix);
          this.matrixVis.renderMatrix(reconstructed, this.mfModel);
          this.matrixVis.renderLossCurve(this.mfModel.lossHistory);
        }
      });
    });
  }

  _renderSpotifyFeed() {
    const grid = document.getElementById("spotifyMediaGrid");
    if (!grid) return;

    const probeVector = [
      this.vectorVis ? this.vectorVis.probe.danceability : 0.75,
      this.vectorVis ? this.vectorVis.probe.energy : 0.70,
      this.vectorVis ? this.vectorVis.probe.valence : 0.65,
      this.vectorVis ? this.vectorVis.probe.acousticness : 0.15,
      this.vectorVis ? this.vectorVis.probe.instrumentalness : 0.05,
      this.vectorVis ? this.vectorVis.probe.tempo : 0.60
    ];

    const recommendedTracks = this.hybridEngine.recommendTracks(probeVector, TRACKS, 8);

    let html = "";
    recommendedTracks.forEach(({ item, matchPct, traitMatches, distance }) => {
      html += `
        <article class="track-card">
          <div class="track-cover-art" style="background: ${item.coverGradient}; position: relative; overflow: hidden;">
            <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.style.display='none'" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;">
            <span class="track-play-icon" style="position: relative; z-index: 2;">▶</span>
          </div>

          <div class="track-info-col">
            <h4 class="track-title">${item.title}</h4>
            <p class="track-artist">${item.artist} · ${item.genre}</p>
            <div class="track-traits">
              ${traitMatches.map(t => `<span class="trait-badge">${t}</span>`).join("")}
            </div>
          </div>

          <div class="track-match-col">
            <div class="match-pct-text">${matchPct}%</div>
            <div class="match-dist-sub">L2 Dist: ${distance}</div>
          </div>
        </article>
      `;
    });

    grid.innerHTML = html;
  }

  /* ========================================================================
     Tab 2: Matrix Factorization Controls & Rendering
     ======================================================================== */

  _initMatrixControls() {
    const sliderK = document.getElementById("sliderK");
    const valK = document.getElementById("valK");
    const sliderLr = document.getElementById("sliderLr");
    const valLr = document.getElementById("valLr");
    const sliderLambda = document.getElementById("sliderLambda");
    const valLambda = document.getElementById("valLambda");

    sliderK.addEventListener("input", (e) => {
      valK.textContent = e.target.value;
      this.mfModel.initialize(this.ratingsMatrix, parseInt(e.target.value, 10));
      this.renderMatrixLab();
    });

    sliderLr.addEventListener("input", (e) => {
      valLr.textContent = e.target.value;
      this.mfModel.lr = parseFloat(e.target.value);
    });

    sliderLambda.addEventListener("input", (e) => {
      valLambda.textContent = e.target.value;
      this.mfModel.lambda = parseFloat(e.target.value);
    });

    document.getElementById("btnStepEpoch").addEventListener("click", () => {
      this.mfModel.stepEpoch(this.ratingsMatrix);
      this.renderMatrixLab();
      this.renderFeed();
    });

    document.getElementById("btnAutoTrain").addEventListener("click", () => {
      this.mfModel.train(this.ratingsMatrix, 25);
      this.renderMatrixLab();
      this.renderFeed();
    });

    document.getElementById("btnResetMatrix").addEventListener("click", () => {
      this.ratingsMatrix = INITIAL_RATINGS.map(row => [...row]);
      this.currentUser.ratings = this.ratingsMatrix[0];
      this.mfModel.initialize(this.ratingsMatrix, parseInt(sliderK.value, 10));
      this.renderMatrixLab();
      this.renderFeed();
    });
  }

  renderMatrixLab() {
    if (!this.matrixVis) return;
    const reconstructed = this.mfModel.getReconstructedMatrix(this.ratingsMatrix);
    this.matrixVis.renderMatrix(reconstructed, this.mfModel);
    this.matrixVis.renderLossCurve(this.mfModel.lossHistory);
  }

  _inspectMatrixCell(u, i, cellData, mf) {
    const title = document.getElementById("inspectorTitle");
    const container = document.getElementById("inspectorMathContent");
    if (!title || !container) return;

    const userName = USER_NAMES[u];
    const movieTitle = MOVIES[i].title;

    title.textContent = `${userName} ➔ "${movieTitle}"`;

    let dotSum = 0;
    const factorProducts = [];
    for (let k = 0; k < mf.K; k++) {
      const prod = mf.P[u][k] * mf.Q[i][k];
      dotSum += prod;
      factorProducts.push(`(P[${k}] · Q[${k}] = ${mf.P[u][k].toFixed(2)} · ${mf.Q[i][k].toFixed(2)} = ${prod.toFixed(2)})`);
    }

    const mu = mf.mu.toFixed(2);
    const bu = mf.bu[u].toFixed(2);
    const bi = mf.bi[i].toFixed(2);
    const totalDot = dotSum.toFixed(2);
    const predicted = cellData.predicted;

    container.innerHTML = `
      <div class="math-decomposition">
        <span class="math-chip">μ (Global Mean): ${mu}</span>
        <span>+</span>
        <span class="math-chip">b_u (User Bias): ${bu}</span>
        <span>+</span>
        <span class="math-chip">b_i (Item Bias): ${bi}</span>
        <span>+</span>
        <span class="math-chip">P_u · Q_i (Latent Interaction): ${totalDot}</span>
        <span>=</span>
        <span class="math-chip result">Predicted Rating: ${predicted} ★</span>
        ${cellData.isObserved ? `<span class="math-chip" style="background: rgba(250, 204, 21, 0.2); border-color: #facc15;">Actual: ${cellData.actual} ★</span>` : ''}
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">
        Factor Dot Product Breakdown (K=${mf.K}): ${factorProducts.join(" + ")}
      </p>
    `;
  }

  /* ========================================================================
     Tab 3: Spotify Vector Space Controls & Rendering
     ======================================================================== */

  _initVectorControls() {
    const sliderEnergy = document.getElementById("sliderProbeEnergy");
    const valEnergy = document.getElementById("valProbeEnergy");
    const sliderValence = document.getElementById("sliderProbeValence");
    const valValence = document.getElementById("valProbeValence");
    const sliderDance = document.getElementById("sliderProbeDance");
    const valDance = document.getElementById("valProbeDance");
    const sliderAcoustic = document.getElementById("sliderProbeAcoustic");
    const valAcoustic = document.getElementById("valProbeAcoustic");

    sliderEnergy.addEventListener("input", (e) => {
      valEnergy.textContent = e.target.value;
      this.vectorVis.setProbe({ energy: parseFloat(e.target.value) });
      this._updateVectorRecommendations();
    });

    sliderValence.addEventListener("input", (e) => {
      valValence.textContent = e.target.value;
      this.vectorVis.setProbe({ valence: parseFloat(e.target.value) });
      this._updateVectorRecommendations();
    });

    sliderDance.addEventListener("input", (e) => {
      valDance.textContent = e.target.value;
      this.vectorVis.setProbe({ danceability: parseFloat(e.target.value) });
      this._updateVectorRecommendations();
    });

    sliderAcoustic.addEventListener("input", (e) => {
      valAcoustic.textContent = e.target.value;
      this.vectorVis.setProbe({ acousticness: parseFloat(e.target.value) });
      this._updateVectorRecommendations();
    });

    document.getElementById("btnToggleHyperplanes").addEventListener("click", () => {
      this.vectorVis.showHyperplanes = !this.vectorVis.showHyperplanes;
      this.vectorVis.render();
    });
  }

  _syncProbeInputs(probe) {
    const sliderEnergy = document.getElementById("sliderProbeEnergy");
    const valEnergy = document.getElementById("valProbeEnergy");
    const sliderValence = document.getElementById("sliderProbeValence");
    const valValence = document.getElementById("valProbeValence");

    if (sliderEnergy && valEnergy) {
      sliderEnergy.value = probe.energy;
      valEnergy.textContent = probe.energy.toFixed(2);
    }
    if (sliderValence && valValence) {
      sliderValence.value = probe.valence;
      valValence.textContent = probe.valence.toFixed(2);
    }
  }

  _updateVectorRecommendations() {
    const queryVec = [
      this.vectorVis.probe.danceability,
      this.vectorVis.probe.energy,
      this.vectorVis.probe.valence,
      this.vectorVis.probe.acousticness,
      this.vectorVis.probe.instrumentalness,
      this.vectorVis.probe.tempo
    ];

    const nearest = this.knnEngine.findNearest(queryVec, 4, "cosine");
    this.vectorVis.setMatches(nearest.results);

    // Update DAA Benchmark Stats
    const benchmark = DAABenchmarkSuite.benchmarkNearestNeighbor(
      TRACKS,
      AUDIO_FEATURE_KEYS,
      queryVec,
      4
    );

    const statBox = document.getElementById("benchmarkStats");
    if (statBox) {
      statBox.innerHTML = `
        <div><strong>Brute Force KNN:</strong> ${benchmark.bruteForce.operations} ops (${benchmark.bruteForce.complexity})</div>
        <div><strong>Spotify Annoy:</strong> ${benchmark.annoyIndex.operations} ops (${benchmark.annoyIndex.complexity})</div>
        <div style="color: #4ade80; margin-top: 0.3rem;">🚀 Spotify Speedup: ${benchmark.annoyIndex.speedup} at scale</div>
        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.3rem;">
          At 100M songs: Brute Force = 600M ops (450ms) vs Annoy = 486 ops (&lt;0.5ms)!
        </div>
      `;
    }

    if (this.feedPlatform === "spotify") {
      this._renderSpotifyFeed();
    }
  }

  renderVectorLab() {
    if (!this.vectorVis) return;
    this._updateVectorRecommendations();
    this.vectorVis.render();
  }

  /* ========================================================================
     Tab 4: Artwork Bandit Controls & Rendering
     ======================================================================== */

  _initBanditControls() {
    const selectStrategy = document.getElementById("selectBanditStrategy");
    const btnStep = document.getElementById("btnStepBandit");
    const btnBatch = document.getElementById("btnRunBanditBatch");
    const btnReset = document.getElementById("btnResetBandit");

    btnStep.addEventListener("click", () => {
      this.banditSim.step(selectStrategy.value, 0.15);
      this.renderBanditLab();
      this.renderFeed(); // Netflix feed updates to show chosen artwork!
    });

    btnBatch.addEventListener("click", () => {
      this.banditSim.runBatch(100, selectStrategy.value, 0.15);
      this.renderBanditLab();
      this.renderFeed();
    });

    btnReset.addEventListener("click", () => {
      this.banditSim.reset();
      this.renderBanditLab();
      this.renderFeed();
    });
  }

  renderBanditLab() {
    const state = this.banditSim.getState();

    // Update stat numbers
    const ctrEl = document.getElementById("banditStatCtr");
    const regretEl = document.getElementById("banditStatRegret");
    if (ctrEl) ctrEl.textContent = `${(state.overallCtr * 100).toFixed(1)}%`;
    if (regretEl) regretEl.textContent = state.cumulativeRegret;

    // Render Artwork Variants Gallery
    const gallery = document.getElementById("banditGallery");
    if (gallery) {
      let html = "";
      this.banditSim.variants.forEach((v, idx) => {
        const pulls = state.pullCounts[idx];
        const estCtr = (parseFloat(state.estimatedCtrs[idx]) * 100).toFixed(1);
        const trueCtr = (state.trueCtrs[idx] * 100).toFixed(0);
        const isOptimal = idx === state.optimalArm;

        html += `
          <div class="bandit-arm-card ${isOptimal && pulls > 20 ? 'winning' : ''}">
            <span class="arm-badge ${isOptimal ? 'optimal' : 'regular'}">
              ${isOptimal ? 'Optimal Variant' : 'Variant ' + (idx + 1)}
            </span>
            <div class="arm-preview-art" style="background: ${MOVIES[0].posterGradients}">
              ${v.name}
            </div>
            <h4 style="font-size: 0.95rem; margin-bottom: 0.2rem;">${v.name}</h4>
            <p style="font-size: 0.75rem; color: var(--text-muted);">${v.targetSegment}</p>
            <div class="arm-stats-row">
              <span>Impressions:</span>
              <span class="arm-stat-val">${pulls}</span>
            </div>
            <div class="arm-stats-row">
              <span>Estimated CTR:</span>
              <span class="arm-stat-val" style="color: ${isOptimal ? '#fca5a5' : '#93c5fd'}">${estCtr}%</span>
            </div>
            <div class="arm-stats-row">
              <span>True CTR Ground Truth:</span>
              <span class="arm-stat-val">${trueCtr}%</span>
            </div>
          </div>
        `;
      });
      gallery.innerHTML = html;
    }

    // Render Charts
    if (this.banditVis) {
      this.banditVis.renderRegretChart(this.banditSim.history);
      this.banditVis.renderArmAllocation(
        state.pullCounts,
        state.estimatedCtrs,
        state.trueCtrs,
        state.optimalArm
      );
    }
  }

  /* ========================================================================
     Viva Defense Presentation Mode
     ======================================================================== */

  _initVivaDefense() {
    const overlay = document.getElementById("vivaOverlay");
    const btnOpen = document.getElementById("btnOpenViva");
    const btnClose = document.getElementById("btnCloseViva");
    const btnPrev = document.getElementById("btnVivaPrev");
    const btnNext = document.getElementById("btnVivaNext");

    btnOpen.addEventListener("click", () => {
      overlay.classList.add("active");
      this.currentVivaSlide = 0;
      this._renderVivaSlide();
    });

    btnClose.addEventListener("click", () => {
      overlay.classList.remove("active");
    });

    btnPrev.addEventListener("click", () => {
      if (this.currentVivaSlide > 0) {
        this.currentVivaSlide--;
        this._renderVivaSlide();
      }
    });

    btnNext.addEventListener("click", () => {
      if (this.currentVivaSlide < this.vivaSlides.length - 1) {
        this.currentVivaSlide++;
        this._renderVivaSlide();
      } else {
        overlay.classList.remove("active");
      }
    });

    // Keyboard navigation
    window.addEventListener("keydown", (e) => {
      if (!overlay.classList.contains("active")) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        if (this.currentVivaSlide < this.vivaSlides.length - 1) {
          this.currentVivaSlide++;
          this._renderVivaSlide();
        }
      } else if (e.key === "ArrowLeft") {
        if (this.currentVivaSlide > 0) {
          this.currentVivaSlide--;
          this._renderVivaSlide();
        }
      } else if (e.key === "Escape") {
        overlay.classList.remove("active");
      }
    });
  }

  _renderVivaSlide() {
    const slide = this.vivaSlides[this.currentVivaSlide];
    const content = document.getElementById("vivaSlideContent");
    const progress = document.getElementById("vivaProgress");
    const btnNext = document.getElementById("btnVivaNext");

    if (progress) {
      progress.textContent = `Slide ${this.currentVivaSlide + 1} of ${this.vivaSlides.length}`;
    }

    if (btnNext) {
      btnNext.textContent = this.currentVivaSlide === this.vivaSlides.length - 1 ? "Finish Defense ➔" : "Next Slide →";
    }

    if (content) {
      content.innerHTML = `
        <h3>${slide.subtitle}</h3>
        <h2>${slide.title}</h2>
        <p>${slide.summary}</p>
        <ul>
          ${slide.points.map(p => `<li>${p}</li>`).join("")}
        </ul>
        <div class="math-formula-box">${slide.formula}</div>
      `;
    }
  }

  _getVivaSlideData() {
    return [
      {
        subtitle: "1. Problem Statement & Streaming Scale",
        title: "The Industrial Recommendation Challenge",
        summary: "Netflix (250M users, 15K titles) and Spotify (600M users, 100M songs) operate under a strict 15-millisecond latency budget to serve recommendations driving over 80% of total platform consumption.",
        points: [
          "Extreme Matrix Sparsity: User-item interaction matrices are over 99.5% unobserved.",
          "Curse of Dimensionality: Exact Nearest Neighbor (KNN) in D-dimensional audio feature space requires O(N · D) calculations, which is computationally infeasible on 100M tracks.",
          "The Cold-Start Dilemma: Pure Collaborative Filtering breaks down when new items lack historical rating logs.",
          "Explore vs Exploit Dilemma: Static visual presentation induces fatigue; platforms must dynamically learn visual affinity."
        ],
        formula: "Sparsity = 1 - (|R_observed| / (|U| × |I|)) > 0.995"
      },
      {
        subtitle: "2. Netflix Core Algorithm",
        title: "Collaborative Filtering via Regularized Funk SVD",
        summary: "Rather than decomposing full matrices via Lanczos/LAPACK SVD (O(min(U·I², U²·I))), Simon Funk SVD executes Stochastic Gradient Descent strictly on observed ratings, regularized by L2 penalty.",
        points: [
          "Matrix Factorization decomposes sparse R ≈ P × Qᵀ into rank-K user and item latent matrices.",
          "Incorporates global average baseline μ, user bias b_u, and item bias b_i to model rating shifts.",
          "Training Time Complexity per Epoch: O(|R_observed| · K) — entirely linear in the count of rated items!",
          "Inference Latency: O(K) dot product between latent factor vectors."
        ],
        formula: "min_{P,Q} Σ (r_{ui} - μ - b_u - b_i - p_u · q_iᵀ)² + λ(||p_u||² + ||q_i||² + b_u² + b_i²)"
      },
      {
        subtitle: "3. Spotify Core Algorithm",
        title: "High-Dimensional Vector Space & Annoy Sub-linear Search",
        summary: "Spotify maps acoustic characteristics (danceability, energy, valence, acousticness) into a high-dimensional vector space. To avoid O(N · D) brute force KNN, Spotify created Annoy (Approximate Nearest Neighbors).",
        points: [
          "Acoustic Feature Extraction: Normalizes audio attributes to create D-dimensional embeddings.",
          "Cosine Similarity: Measures angle between taste vectors invariant to magnitude.",
          "Random Projection Trees (Annoy): Recursively partitions space with hyperplanes in O(T · N log N) build time.",
          "Sub-linear Retrieval: Query time drops from O(N · D) to O(T · D · log N), achieving 99%+ recall in <0.5ms!"
        ],
        formula: "Query Time: O(T · D · log N)  vs  Brute-Force: O(N · D)   [Speedup > 1,200,000× at 100M items]"
      },
      {
        subtitle: "4. Online Personalization",
        title: "Contextual Multi-Armed Bandits for Dynamic Artwork",
        summary: "Netflix dynamically chooses which movie poster to show each member. Rather than static A/B testing, Netflix uses Contextual Bandits to minimize cumulative regret while discovering user aesthetic preferences.",
        points: [
          "Arms: K thumbnail variants (e.g. action hero vs romance close-up).",
          "Exploration vs Exploitation: Explores untested posters while exploiting the current conversion champion.",
          "Upper Confidence Bound (UCB1): Balances empirical CTR μ̂_k with exploration bonus √( (2 ln T) / n_k ).",
          "Asymptotic Regret: Achieves O(log T) sub-linear regret, bounded by Lai & Robbins theorem, beating linear O(T) regret."
        ],
        formula: "UCB1: Arm* = argmax [ μ̂_k + c · √( (2 · ln T) / n_k ) ]  ➔  Regret: O(log T)"
      },
      {
        subtitle: "5. Production Architecture & Research Gap",
        title: "The StreamPulse-Hybrid 3-Stage Recommender Funnel",
        summary: "Our StreamPulse-Hybrid model solves the trust and latency gaps by combining candidate retrieval, latent factorization, and transparent 'Why Recommended?' explainability.",
        points: [
          "Stage 1 (Retrieval): Prunes universe from 100M to 1,000 candidates via Annoy sub-linear trees.",
          "Stage 2 (Heavy Scoring): Multi-objective utility combining SVD latent prediction and genre affinity.",
          "Stage 3 (Re-ranking): Maximal Marginal Relevance (MMR) ensures catalog diversity and prevents echo chambers.",
          "Transparent Attribution: Solves the Black-Box problem by reporting % Collaborative, % Content, and % Acclaim."
        ],
        formula: "Score(u, i) = w_CF · SVD(u,i) + w_CB · Cosine(u,i) + w_Pop · Pop(i) - w_Fatigue · Novelty(i)"
      }
    ];
  }
}

// Bootstrap application on DOM load
window.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
  window.__StreamPulseApp = app; // Expose for testing/debugging
});
