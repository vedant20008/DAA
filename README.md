# StreamPulse: How Netflix & Spotify Recommendation Algorithms Choose Content for You

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen?style=for-the-badge)](#zero-dependencies)
[![DAA Project](https://img.shields.io/badge/Course-CS--DAA-crimson?style=for-the-badge)](#academic-overview)

> **Design and Analysis of Algorithms (CS-DAA) Academic Research Project & Live Interactive Simulation Laboratory**  
> Explore the mathematical, algorithmic, and heuristic mechanisms powering personalized recommendation engines in modern streaming platforms.

---

## 🌟 Live Features & DAA Algorithms

1. **Netflix Collaborative Filtering (Simon Funk SVD / SGD)**
   - Matrix Factorization over sparse User-Item interaction matrices.
   - Stochastic Gradient Descent (SGD) minimizing RMSE loss with L2 regularization.
   - Latent factor decomposition ($K=3$).

2. **Spotify Content-Based High-Dimensional Audio Space**
   - 6-Dimensional acoustic feature space (*danceability, energy, valence, acousticness, instrumentalness, tempo*).
   - Fast Approximate Nearest Neighbors (ANN) using **Spotify Annoy Trees** (random projection hyperplanes) vs **Brute-Force KNN** ($O(N \cdot D)$).

3. **Dynamic Artwork Personalization (Multi-Armed Bandits)**
   - Contextual bandits testing artwork variants for titles (e.g. *Stranger Things*).
   - Real-time comparison between **UCB1 (Upper Confidence Bound)**, **Epsilon-Greedy**, and **Thompson Sampling (Bayesian Beta distribution)**.

4. **DAA Efficient Top-K Retrieval Engine**
   - Min-Heap-based bounded Top-$K$ ranking achieving **$O(N \log K)$** time complexity.
   - Benchmark comparison against naïve full sorting **$O(N \log N)$** across varying catalog sizes.

5. **Live Global Streaming Charts Integration**
   - Real-time proxy connecting to live Apple Music & iTunes RSS charts.
   - Automatic serverless function support on Vercel with graceful client-side fallback.

6. **Interactive Viva Voce Defense Deck & Academic Report**
   - Built-in slide presentation mode for academic examiners.
   - Comprehensive IEEE-format academic paper with LaTeX mathematical proofs (`report.html`).

---

## 🚀 Quick Start (Local Development)

This project requires **zero external npm dependencies**—Node.js standard libraries only!

### Prerequisites
- Node.js 18.0.0 or later (for native `fetch`)

### Run Locally
```bash
# Clone the repository
git clone https://github.com/your-username/streampulse-daa.git
cd streampulse-daa

# Start the local development server
npm start
# or
node server.js
```
The server will start at `http://localhost:5500` and automatically open your default browser.

On Windows, you can also double-click `run.bat` to launch the server immediately.

---

## ☁️ Deploying to Vercel

This repository is pre-configured for 1-click deployment on **Vercel** with zero configuration required.

### Option 1: Via Vercel Web Dashboard (Recommended)
1. Push this repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your `streampulse-daa` repository.
4. Keep the default settings:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./`
   - **Build Command**: *Leave blank*
   - **Output Directory**: *Leave blank*
5. Click **Deploy**. Your app and `/api/live-trending` serverless function will be live immediately!

### Option 2: Via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy directly from repository root
vercel
```

### Vercel Configuration Highlights (`vercel.json`)
- **Serverless API Function**: `api/live-trending.js` provides live iTunes & Apple Music streaming charts with CORS headers and CDN edge caching (`s-maxage=300, stale-while-revalidate=600`).
- **Clean URLs**: Direct clean path routing (`/report` -> `/report.html`).
- **Security Headers**: Includes `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `X-XSS-Protection: 1; mode=block`.

---

## 🌐 Deploying to GitHub Pages (Alternative Static Git Hosting)

This project also runs cleanly on **GitHub Pages**:
1. Push code to your GitHub repository.
2. In your repository, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
4. Select `main` branch and `/ (root)` folder, then click **Save**.
5. *Note:* In static GitHub Pages hosting where serverless functions are unavailable, the application automatically falls back to direct client-side RSS feed synchronization!

---

## 📁 Repository Structure

```text
├── index.html                   # Main interactive simulation application
├── report.html                  # IEEE-format academic research paper
├── CS-DAA-Research-Report.pdf   # Formatted PDF research report
├── REPORT.md                    # Academic report markdown source
├── PRESENTATION.md              # Viva Voce presentation slide notes
├── walkthrough.md               # 15-step project methodology guide
├── vercel.json                  # Vercel deployment & security headers configuration
├── package.json                 # Project metadata & npm scripts
├── .gitignore                   # Git exclusion rules
├── .gitattributes               # Cross-platform line-ending normalization
├── api/
│   └── live-trending.js         # Vercel serverless function for live streaming charts
├── server.js                    # Zero-dependency local Node.js development server
├── server.ps1                   # Standalone PowerShell static server
├── run.bat                      # One-click Windows runner
├── research/
│   └── ACADEMIC_RESEARCH_DOSSIER.md # Literature review & paper notes
├── styles/
│   ├── main.css                 # Dark-mode glassmorphic theme & typography
│   ├── components.css           # UI components, badges, controls
│   └── visualizers.css          # Canvas visualizer containers & graphs
├── js/
│   ├── bundle.js                # Self-contained runtime bundle
│   ├── app.js                   # Modular application controller
│   ├── algorithms/              # Core DAA algorithms (SVD, KNN, Annoy, Bandits, Min-Heap)
│   ├── visualizers/             # Canvas 2D/3D visualizers & matrix heatmaps
│   └── data/                    # Dataset preprocessors & benchmark datasets
└── assets/
    └── images/                  # High-resolution poster & artwork assets
```

---

## 📜 License & Academic Attribution

This project is open-source under the [MIT License](LICENSE).  
Created as an academic submission for the **Design and Analysis of Algorithms (CS-DAA)** course curriculum.
