/**
 * Multi-Armed Bandit Chart & Convergence Visualizer (Netflix Dynamic Artwork)
 * Visualizes:
 * 1. Cumulative Regret over time (Logarithmic O(log T) vs Linear O(T))
 * 2. Arm Allocation Distribution (Bar chart showing exploration -> exploitation transition)
 */

export class BanditVisualizer {
  constructor(regretCanvasId, armCanvasId, variants) {
    this.regretCanvas = document.getElementById(regretCanvasId);
    this.regretCtx = this.regretCanvas ? this.regretCanvas.getContext("2d") : null;
    this.armCanvas = document.getElementById(armCanvasId);
    this.armCtx = this.armCanvas ? this.armCanvas.getContext("2d") : null;
    this.variants = variants;
  }

  /**
   * Renders Cumulative Regret Curve
   */
  renderRegretChart(history) {
    if (!this.regretCanvas || !this.regretCtx) return;
    const canvas = this.regretCanvas;
    const ctx = this.regretCtx;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const pad = { top: 20, right: 25, bottom: 35, left: 55 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const data = history.cumulativeRegret;
    if (data.length < 2) {
      ctx.fillStyle = "#64748b";
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Run impressions to observe sub-linear logarithmic regret convergence", width / 2, height / 2);
      return;
    }

    const maxT = Math.max(50, history.timesteps[history.timesteps.length - 1]);
    const maxRegret = Math.max(10, Math.max(...data) * 1.15);

    // Grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let r = 0; r <= 4; r++) {
      const y = pad.top + (plotH / 4) * r;
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);

      const val = (maxRegret - (maxRegret / 4) * r).toFixed(1);
      ctx.fillStyle = "#64748b";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "right";
      ctx.fillText(val, pad.left - 8, y + 3);
    }
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Impressions (T)", width / 2, height - 8);

    ctx.save();
    ctx.translate(16, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Cumulative Regret R(T)", 0, 0);
    ctx.restore();

    // Draw Theoretical O(T) Linear Regret (Worst Case / Random)
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + (1 - (maxRegret * 0.75) / maxRegret) * plotH);
    ctx.stroke();
    ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Linear Regret O(T) [Random Selection]", width - pad.right - 5, pad.top + 35);
    ctx.restore();

    // Draw Actual Regret Path
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const t = history.timesteps[i];
      const x = pad.left + (t / maxT) * plotW;
      const y = pad.top + (1 - data[i] / maxRegret) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#8B5CF6"; // Electric Violet
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Gradient fill
    ctx.lineTo(pad.left + (history.timesteps[data.length - 1] / maxT) * plotW, pad.top + plotH);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    grad.addColorStop(0, "rgba(139, 92, 246, 0.3)");
    grad.addColorStop(1, "rgba(139, 92, 246, 0.0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Optimal Logarithmic annotation
    ctx.fillStyle = "#8B5CF6";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "left";
    const lastY = pad.top + (1 - data[data.length - 1] / maxRegret) * plotH;
    ctx.fillText(`Logarithmic O(log T) Flattening: ${data[data.length - 1]} Regret`, pad.left + 15, Math.max(pad.top + 20, lastY - 10));
  }

  /**
   * Renders Arm Pull Distribution Bar Chart
   */
  renderArmAllocation(pullCounts, estimatedCtrs, trueCtrs, optimalArm) {
    if (!this.armCanvas || !this.armCtx) return;
    const canvas = this.armCanvas;
    const ctx = this.armCtx;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const pad = { top: 30, right: 30, bottom: 40, left: 60 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const totalPulls = pullCounts.reduce((a, b) => a + b, 0) || 1;
    const K = pullCounts.length;
    const barWidth = Math.min(65, (plotW / K) * 0.65);
    const gap = plotW / K;

    for (let k = 0; k < K; k++) {
      const pulls = pullCounts[k];
      const pct = pulls / totalPulls;
      const barH = pct * plotH;
      const x = pad.left + gap * k + (gap - barWidth) / 2;
      const y = pad.top + plotH - barH;
      const isOptimal = k === optimalArm;

      // Bar with gradient
      const grad = ctx.createLinearGradient(0, y, 0, pad.top + plotH);
      if (isOptimal) {
        grad.addColorStop(0, "#E50914"); // Netflix Red for winning thumbnail
        grad.addColorStop(1, "rgba(229, 9, 20, 0.4)");
      } else {
        grad.addColorStop(0, "#3b82f6");
        grad.addColorStop(1, "rgba(59, 130, 246, 0.3)");
      }

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barH);
      ctx.strokeStyle = isOptimal ? "#ffffff" : "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = isOptimal ? 2 : 1;
      ctx.strokeRect(x, y, barWidth, barH);

      // Percentage & Pull count above bar
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${(pct * 100).toFixed(0)}%`, x + barWidth / 2, Math.max(pad.top + 12, y - 16));
      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px Inter, sans-serif";
      ctx.fillText(`${pulls} views`, x + barWidth / 2, Math.max(pad.top + 22, y - 5));

      // Thumbnail Name Below
      const variantName = this.variants[k] ? this.variants[k].name : `Thumbnail ${k + 1}`;
      ctx.fillStyle = isOptimal ? "#E50914" : "#e2e8f0";
      ctx.font = isOptimal ? "bold 11px Inter, sans-serif" : "10px Inter, sans-serif";
      ctx.fillText(variantName, x + barWidth / 2, height - pad.bottom + 16);

      // True CTR vs Learned CTR pill
      const estCtrText = estimatedCtrs[k] ? `${(parseFloat(estimatedCtrs[k]) * 100).toFixed(1)}%` : "0%";
      const trueCtrText = `${(trueCtrs[k] * 100).toFixed(0)}%`;
      ctx.font = "9px JetBrains Mono, monospace";
      ctx.fillStyle = isOptimal ? "#fca5a5" : "#93c5fd";
      ctx.fillText(`Est: ${estCtrText} (True: ${trueCtrText})`, x + barWidth / 2, height - pad.bottom + 28);
    }
  }
}
