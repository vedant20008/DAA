const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const moviesDir = path.join(__dirname, '..', 'assets', 'images', 'movies');
const tracksDir = path.join(__dirname, '..', 'assets', 'images', 'tracks');

fs.mkdirSync(moviesDir, { recursive: true });
fs.mkdirSync(tracksDir, { recursive: true });

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) StreamPulse/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadFile(res.headers.location, destPath));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(destPath);
      });
      fileStream.on('error', reject);
    });
    req.on('error', reject);
  });
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) StreamPulse/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function run() {
  console.log('Downloading Movie Posters...');

  const movies = [
    { id: 'stranger-things', type: 'tvmaze', query: 'Stranger Things' },
    { id: 'inception', type: 'wiki', title: 'Inception' },
    { id: 'queens-gambit', type: 'tvmaze', query: "The Queen's Gambit" },
    { id: 'interstellar', type: 'wiki', title: 'Interstellar_(film)' },
    { id: 'la-la-land', type: 'wiki', title: 'La_La_Land' },
    { id: 'black-mirror', type: 'tvmaze', query: 'Black Mirror' },
    { id: 'squid-game', type: 'tvmaze', query: 'Squid Game' },
    { id: 'the-office', type: 'tvmaze', query: 'The Office' }
  ];

  for (const m of movies) {
    const dest = path.join(moviesDir, `${m.id}.jpg`);
    try {
      let imgUrl = null;
      if (m.type === 'tvmaze') {
        const data = await fetchJson(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(m.query)}`);
        imgUrl = data.image ? (data.image.original || data.image.medium) : null;
      } else if (m.type === 'wiki') {
        const data = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(m.title)}`);
        imgUrl = data.originalimage ? data.originalimage.source : (data.thumbnail ? data.thumbnail.source : null);
      }
      if (imgUrl) {
        console.log(`Downloading movie [${m.id}] from ${imgUrl}...`);
        await downloadFile(imgUrl, dest);
        console.log(`Saved [${m.id}]: ${(fs.statSync(dest).size / 1024).toFixed(1)} KB`);
      } else {
        console.warn(`No image found for movie ${m.id}`);
      }
    } catch (err) {
      console.error(`Error downloading movie ${m.id}:`, err.message);
    }
  }

  console.log('\nDownloading Song Album Artwork...');

  const tracks = [
    { id: 'blinding-lights', q: 'Blinding Lights The Weeknd' },
    { id: 'midnight-city', q: 'Midnight City M83' },
    { id: 'clair-de-lune', q: 'Debussy Clair de Lune' },
    { id: 'experience', q: 'Ludovico Einaudi Experience' },
    { id: 'starboy', q: 'The Weeknd Starboy' },
    { id: 'weightless', q: 'Marconi Union Weightless' },
    { id: 'levitating', q: 'Dua Lipa Levitating' },
    { id: 'giorgio-by-moroder', q: 'Daft Punk Giorgio by Moroder' },
    { id: 'as-it-was', q: 'Harry Styles As It Was' },
    { id: 'bad-guy', q: 'Billie Eilish bad guy' },
    { id: 'strobe', q: 'deadmau5 Strobe' },
    { id: 'someone-like-you', q: 'Adele Someone Like You' },
    { id: 'gods-plan', q: 'Drake Gods Plan' }
  ];

  for (const t of tracks) {
    const dest = path.join(tracksDir, `${t.id}.jpg`);
    try {
      const itunesData = await fetchJson(`https://itunes.apple.com/search?term=${encodeURIComponent(t.q)}&media=music&limit=1`);
      if (itunesData.results && itunesData.results.length > 0) {
        let artUrl = itunesData.results[0].artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg');
        console.log(`Downloading track [${t.id}] from ${artUrl}...`);
        await downloadFile(artUrl, dest);
        console.log(`Saved [${t.id}]: ${(fs.statSync(dest).size / 1024).toFixed(1)} KB`);
      } else {
        console.warn(`No iTunes results for track ${t.id}`);
      }
    } catch (err) {
      console.error(`Error downloading track ${t.id}:`, err.message);
    }
  }

  console.log('\nDownload complete!');
}

run();
