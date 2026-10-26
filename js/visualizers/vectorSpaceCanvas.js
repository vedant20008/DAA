/**
 * Interactive 2D Audio Vector Space Visualizer (Spotify Content-Based Engine)
 * Renders audio features on a 2D plane (e.g., Valence vs Energy),
 * allows interactive probe dragging, connects nearest neighbor arcs,
 * and visualizes Annoy tree random hyperplane partitions.
 */

import { VectorMath } from "../algorithms/vectorSimilarity.js";

export class VectorSpaceVisualizer {
  constructor(canvasId, tracks, featureKeys) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.tracks = tracks;
    this.featureKeys = featureKeys;

    // Projection axes: X = Valence (Happiness), Y = Energy (Intensity)
    this.xAxisKey = "valence";
    this.yAxisKey = "energy";

    // User Taste Probe (default center-high)
    this.probe = {
      danceability: 0.75,
      energy: 0.70,
      valence: 0.65,
      acousticness: 0.15,
      instrumentalness: 0.05,
      tempo: 0.60
    };

    this.isDragging = false;
    this.hoveredTrack = null;
    this.topKMatches = [];
    this.showHyperplanes = true;
    this.annoyIndex = null;
    this.onProbeChange = null;

    if (this.canvas) {
      this._initEvents();
    }
  }

  setAnnoyIndex(annoy) {
    this.annoyIndex = annoy;
  }

  setProbe(features) {
    this.probe = { ...this.probe, ...features };
    this.render();
  }

  setAxes(xKey, yKey) {
    this.xAxisKey = xKey;
    this.yAxisKey = yKey;
    this.render();
  }

  setMatches(matches) {
    this.topKMatches = matches;
    this.render();
  }

  _initEvents() {
    const canvas = this.canvas;

    const getCanvasPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    const posToFeatures = (pos) => {
      const pad = 50;
      const plotW = canvas.width - pad * 2;
      const plotH = canvas.height - pad * 2;
      const xVal = Math.max(0, Math.min(1, (pos.x - pad) / plotW));
      const yVal = Math.max(0, Math.min(1, 1 - (pos.y - pad) / plotH));
      return { xVal, yVal };
    };

    canvas.addEventListener("mousedown", (e) => {
      const pos = getCanvasPos(e);
      const pad = 50;
      const plotW = canvas.width - pad * 2;
      const plotH = canvas.height - pad * 2;
      const probeX = pad + this.probe[this.xAxisKey] * plotW;
      const probeY = pad + (1 - this.probe[this.yAxisKey]) * plotH;

      const dist = Math.hypot(pos.x - probeX, pos.y - probeY);
      if (dist <= 25) {
        this.isDragging = true;
      } else {
        // Jump probe to click location
        const { xVal, yVal } = posToFeatures(pos);
        this.probe[this.xAxisKey] = parseFloat(xVal.toFixed(2));
        this.probe[this.yAxisKey] = parseFloat(yVal.toFixed(2));
        this.isDragging = true;
        if (this.onProbeChange) this.onProbeChange(this.probe);
        this.render();
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.canvas) return;
      const pos = getCanvasPos(e);

      if (this.isDragging) {
        const { xVal, yVal } = posToFeatures(pos);
        this.probe[this.xAxisKey] = parseFloat(xVal.toFixed(2));
        this.probe[this.yAxisKey] = parseFloat(yVal.toFixed(2));
        if (this.onProbeChange) this.onProbeChange(this.probe);
        this.render();
        return;
      }

      // Check track hover
      const pad = 50;
      const plotW = canvas.width - pad * 2;
      const plotH = canvas.height - pad * 2;
      let found = null;

      for (const track of this.tracks) {
        const tx = pad + track.features[this.xAxisKey] * plotW;
        const ty = pad + (1 - track.features[this.yAxisKey]) * plotH;
        if (Math.hypot(pos.x - tx, pos.y - ty) < 14) {
          found = track;
          break;
        }
      }

      if (found !== this.hoveredTrack) {
        this.hoveredTrack = found;
        this.render();
      }
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
    });
  }

  render() {
    if (!this.canvas || !this.ctx) return;
    const canvas = this.canvas;
    const ctx = this.ctx;
    const width = canvas.width;
    const height = canvas.height;
    const pad = 50;
    const plotW = width - pad * 2;
    const plotH = height - pad * 2;

    ctx.clearRect(0, 0, width, height);

    // Background aesthetic glow
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width / 1.5);
    bgGrad.addColorStop(0, "#101622");
    bgGrad.addColorStop(1, "#0a0c12");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle 2D Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let s = 0; s <= 10; s++) {
      const gx = pad + (plotW / 10) * s;
      const gy = pad + (plotH / 10) * s;
      ctx.moveTo(gx, pad);
      ctx.lineTo(gx, height - pad);
      ctx.moveTo(pad, gy);
      ctx.lineTo(width - pad, gy);
    }
    ctx.stroke();

    // Axes Borders
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad, pad, plotW, plotH);

    // Quadrant quadrant labels
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.textAlign = "left";
    ctx.fillText("High Energy / Melancholic", pad + 10, pad + 20);
    ctx.textAlign = "right";
    ctx.fillText("High Energy / Euphoric", width - pad - 10, pad + 20);
    ctx.textAlign = "left";
    ctx.fillText("Calm / Introspective", pad + 10, height - pad - 12);
    ctx.textAlign = "right";
    ctx.fillText("Chill / Warm & Sunny", width - pad - 10, height - pad - 12);

    // Axes Title Badges
    ctx.fillStyle = "#1DB954"; // Spotify Green
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`X-Axis: ${this.xAxisKey.toUpperCase()} (0.0 → 1.0)`, width / 2, height - 15);

    ctx.save();
    ctx.translate(18, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`Y-Axis: ${this.yAxisKey.toUpperCase()} (0.0 → 1.0)`, 0, 0);
    ctx.restore();

    // Probe position on canvas
    const probeX = pad + this.probe[this.xAxisKey] * plotW;
    const probeY = pad + (1 - this.probe[this.yAxisKey]) * plotH;

    // Draw Annoy Hyperplane cuts if enabled
    if (this.showHyperplanes && this.annoyIndex && this.annoyIndex.trees) {
      ctx.save();
      ctx.strokeStyle = "rgba(0, 240, 255, 0.18)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;

      // Draw first tree's top hyperplanes
      for (const tree of this.annoyIndex.trees) {
        if (!tree.isLeaf && tree.normal) {
          // Normal is in full D dimensions; project to 2D
          const nx = tree.normal[this.featureKeys.indexOf(this.xAxisKey)] || 0.5;
          const ny = tree.normal[this.featureKeys.indexOf(this.yAxisKey)] || -0.5;
          const len = Math.hypot(nx, ny);
          if (len > 0.001) {
            const dx = -ny / len;
            const dy = nx / len;
            const cx = width / 2;
            const cy = height / 2;
            ctx.beginPath();
            ctx.moveTo(cx - dx * 300, cy - dy * 300);
            ctx.lineTo(cx + dx * 300, cy + dy * 300);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    // Top-K Match Arcs
    const matchedTrackIds = new Set(this.topKMatches.map(m => m.track ? m.track.id : m.item.id));
    for (const match of this.topKMatches) {
      const track = match.track || match.item;
      const tx = pad + track.features[this.xAxisKey] * plotW;
      const ty = pad + (1 - track.features[this.yAxisKey]) * plotH;

      // Draw glowing connection arc
      const sim = match.similarity ?? (match.compositeScore || 0.8);
      ctx.beginPath();
      ctx.moveTo(probeX, probeY);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = `rgba(29, 185, 84, ${0.15 + sim * 0.6})`;
      ctx.lineWidth = 1.5 + sim * 2;
      ctx.stroke();

      // Draw match percentage pill on midpoint
      const mx = (probeX + tx) / 2;
      const my = (probeY + ty) / 2;
      ctx.fillStyle = "rgba(10, 15, 20, 0.85)";
      ctx.strokeStyle = "rgba(29, 185, 84, 0.6)";
      ctx.lineWidth = 1;
      const pctText = `${Math.round(sim * 100)}%`;
      ctx.fillRect(mx - 15, my - 9, 30, 18);
      ctx.strokeRect(mx - 15, my - 9, 30, 18);
      ctx.fillStyle = "#1DB954";
      ctx.font = "bold 9px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(pctText, mx, my + 3);
    }

    // Render Track Nodes
    for (const track of this.tracks) {
      const tx = pad + track.features[this.xAxisKey] * plotW;
      const ty = pad + (1 - track.features[this.yAxisKey]) * plotH;
      const isMatched = matchedTrackIds.has(track.id);
      const isHovered = this.hoveredTrack && this.hoveredTrack.id === track.id;

      // Glow halo for matched or hovered items
      if (isMatched || isHovered) {
        ctx.beginPath();
        ctx.arc(tx, ty, isHovered ? 16 : 12, 0, Math.PI * 2);
        ctx.fillStyle = isMatched ? "rgba(29, 185, 84, 0.25)" : "rgba(255, 255, 255, 0.15)";
        ctx.fill();
      }

      // Track Node Circle
      ctx.beginPath();
      ctx.arc(tx, ty, isHovered ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = track.accentColor || "#1DB954";
      ctx.fill();
      ctx.strokeStyle = isMatched ? "#ffffff" : "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = isMatched ? 2 : 1;
      ctx.stroke();

      // Label below track
      ctx.fillStyle = isMatched ? "#ffffff" : "rgba(226, 232, 240, 0.8)";
      ctx.font = isMatched ? "bold 10px Inter, sans-serif" : "9px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(track.title, tx, ty + (isHovered ? 20 : 15));
    }

    // Render User Taste Probe (Crosshair & Glow Rings)
    // Outer Pulsing Glow
    const probeGlow = ctx.createRadialGradient(probeX, probeY, 4, probeX, probeY, 24);
    probeGlow.addColorStop(0, "rgba(29, 185, 84, 0.6)");
    probeGlow.addColorStop(1, "rgba(29, 185, 84, 0.0)");
    ctx.fillStyle = probeGlow;
    ctx.beginPath();
    ctx.arc(probeX, probeY, 24, 0, Math.PI * 2);
    ctx.fill();

    // Probe Ring
    ctx.beginPath();
    ctx.arc(probeX, probeY, 10, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = "#1DB954";
    ctx.fill();

    // Crosshair Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(probeX - 16, probeY);
    ctx.lineTo(probeX + 16, probeY);
    ctx.moveTo(probeX, probeY - 16);
    ctx.lineTo(probeX, probeY + 16);
    ctx.stroke();

    // Probe Badge
    ctx.fillStyle = "#1DB954";
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Your Taste Probe (Drag Me)", probeX, probeY - 16);

    // Hover Tooltip
    if (this.hoveredTrack) {
      this._renderTooltip(ctx, this.hoveredTrack, pad, plotW, plotH);
    }
  }

  _renderTooltip(ctx, track, pad, plotW, plotH) {
    const tx = pad + track.features[this.xAxisKey] * plotW;
    const ty = pad + (1 - track.features[this.yAxisKey]) * plotH;

    const boxW = 180;
    const boxH = 75;
    const boxX = Math.min(this.canvas.width - boxW - 10, Math.max(10, tx - boxW / 2));
    const boxY = ty > boxH + 20 ? ty - boxH - 12 : ty + 20;

    ctx.fillStyle = "rgba(18, 22, 32, 0.95)";
    ctx.strokeStyle = track.accentColor || "#1DB954";
    ctx.lineWidth = 1.5;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(track.title, boxX + 10, boxY + 18);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText(`${track.artist} · ${track.genre}`, boxX + 10, boxY + 34);

    ctx.fillStyle = "#1DB954";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.fillText(
      `${this.xAxisKey}: ${track.features[this.xAxisKey]} | ${this.yAxisKey}: ${track.features[this.yAxisKey]}`,
      boxX + 10,
      boxY + 54
    );
  }
}
