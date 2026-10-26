/**
 * Interactive Matrix Factorization Visualizer & Loss Curve Renderer
 * Renders the rating matrix R, latent factor heatmaps P & Q^T, and live RMSE loss curve.
 */

export class MatrixVisualizer {
  constructor(containerId, lossCanvasId, userNames, movieTitles) {
    this.container = document.getElementById(containerId);
    this.lossCanvas = document.getElementById(lossCanvasId);
    this.lossCtx = this.lossCanvas ? this.lossCanvas.getContext("2d") : null;
    this.userNames = userNames;
    this.movieTitles = movieTitles;
    this.selectedCell = null;
    this.onCellSelect = null;
  }

  /**
   * Renders the interactive rating matrix grid
   */
  renderMatrix(reconstructedMatrix, mfModel) {
    if (!this.container) return;

    let html = `
      <div class="matrix-table-wrapper">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="matrix-corner-header">Users \\ Titles</th>
    `;

    for (let j = 0; j < this.movieTitles.length; j++) {
      html += `<th class="matrix-col-header" title="${this.movieTitles[j]}">${this.movieTitles[j]}</th>`;
    }
    html += `</tr></thead><tbody>`;

    for (let u = 0; u < reconstructedMatrix.length; u++) {
      const isCurrentUser = u === 0;
      html += `<tr><th class="matrix-row-header ${isCurrentUser ? 'active-user' : ''}">${this.userNames[u]}</th>`;

      for (let i = 0; i < reconstructedMatrix[u].length; i++) {
        const cell = reconstructedMatrix[u][i];
        const isSelected = this.selectedCell && this.selectedCell.u === u && this.selectedCell.i === i;

        if (cell.isObserved) {
          // Observed actual rating
          html += `
            <td class="matrix-cell observed ${isSelected ? 'selected' : ''}" 
                data-u="${u}" data-i="${i}" title="Actual Rating: ${cell.actual} ★ | Predicted: ${cell.predicted}">
              <div class="cell-content">
                <span class="star-icon">★</span>
                <span class="cell-val actual">${cell.actual.toFixed(1)}</span>
              </div>
              <span class="cell-sub">Observed</span>
            </td>
          `;
        } else {
          // Model predicted rating (Missing entry recovered by SVD!)
          html += `
            <td class="matrix-cell predicted ${isSelected ? 'selected' : ''}" 
                data-u="${u}" data-i="${i}" title="Predicted Rating: ${cell.predicted} ★ via SVD Factorization">
              <div class="cell-content">
                <span class="sparkle-icon">✨</span>
                <span class="cell-val pred">${cell.predicted.toFixed(1)}</span>
              </div>
              <span class="cell-sub pred-tag">SVD Rec</span>
            </td>
          `;
        }
      }
      html += `</tr>`;
    }

    html += `</tbody></table></div>`;
    this.container.innerHTML = html;

    // Attach click listeners to cells
    const cells = this.container.querySelectorAll(".matrix-cell");
    cells.forEach(c => {
      c.addEventListener("click", () => {
        const u = parseInt(c.getAttribute("data-u"), 10);
        const i = parseInt(c.getAttribute("data-i"), 10);
        this.selectedCell = { u, i };
        this.renderMatrix(reconstructedMatrix, mfModel);
        if (this.onCellSelect) {
          this.onCellSelect(u, i, reconstructedMatrix[u][i], mfModel);
        }
      });
    });
  }

  /**
   * Renders the live RMSE Loss Curve on HTML5 Canvas
   */
  renderLossCurve(lossHistory) {
    if (!this.lossCanvas || !this.lossCtx) return;
    const canvas = this.lossCanvas;
    const ctx = this.lossCtx;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (lossHistory.length < 2) {
      ctx.fillStyle = "#64748b";
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Click 'Step Epoch' or 'Auto-Train' to observe gradient descent convergence", width / 2, height / 2);
      return;
    }

    const padding = { top: 25, right: 30, bottom: 35, left: 50 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const maxEpoch = Math.max(10, lossHistory[lossHistory.length - 1].epoch);
    const minLoss = 0;
    const maxLoss = Math.max(2.5, ...lossHistory.map(d => d.rmse) * 1.1);

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let r = 0; r <= 4; r++) {
      const y = padding.top + (plotH / 4) * r;
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);

      const val = (maxLoss - (maxLoss / 4) * r).toFixed(1);
      ctx.fillStyle = "#64748b";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "right";
      ctx.fillText(val, padding.left - 8, y + 3);
    }
    ctx.stroke();

    // Axes labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Epochs (SGD Iterations)", width / 2, height - 8);

    ctx.save();
    ctx.translate(14, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Loss (RMSE)", 0, 0);
    ctx.restore();

    // Draw Loss Path with Gradient
    ctx.beginPath();
    for (let i = 0; i < lossHistory.length; i++) {
      const item = lossHistory[i];
      const x = padding.left + (item.epoch / maxEpoch) * plotW;
      const y = padding.top + (1 - item.rmse / maxLoss) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = "#E50914"; // Netflix Red
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw area under curve
    ctx.lineTo(padding.left + (lossHistory[lossHistory.length - 1].epoch / maxEpoch) * plotW, padding.top + plotH);
    ctx.lineTo(padding.left, padding.top + plotH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotH);
    grad.addColorStop(0, "rgba(229, 9, 20, 0.25)");
    grad.addColorStop(1, "rgba(229, 9, 20, 0.0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw current point indicator
    const last = lossHistory[lossHistory.length - 1];
    const lastX = padding.left + (last.epoch / maxEpoch) * plotW;
    const lastY = padding.top + (1 - last.rmse / maxLoss) * plotH;

    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#E50914";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Badge showing current RMSE
    ctx.fillStyle = "#E50914";
    ctx.font = "bold 11px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`RMSE: ${last.rmse.toFixed(3)}`, lastX + 8, Math.max(padding.top + 10, lastY - 4));
  }
}
