// Zero-dependency local development server for StreamPulse DAA
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 5500;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);

  // Live online API route: fetch real-time trending movies and songs
  if (reqPath === '/api/live-trending') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    Promise.all([
      fetch('https://itunes.apple.com/us/rss/topmovies/limit=25/json').then(r => r.json()).catch(() => null),
      fetch('https://itunes.apple.com/us/rss/topsongs/limit=25/json').then(r => r.json()).catch(() => null)
    ]).then(([resM, resS]) => {
      let movies = [];
      let tracks = [];

      if (resM && resM.feed && resM.feed.entry) {
        movies = resM.feed.entry.map((e, idx) => {
          const rawGenre = e.category && e.category.attributes ? e.category.attributes.label : 'Drama';
          const genreVector = [
            rawGenre.includes('Sci-Fi') ? 0.9 : 0.2,
            rawGenre.includes('Horror') ? 0.9 : 0.1,
            rawGenre.includes('Drama') ? 0.9 : 0.4,
            rawGenre.includes('Comedy') ? 0.8 : 0.1,
            rawGenre.includes('Romance') ? 0.8 : 0.1,
            rawGenre.includes('Action') ? 0.95 : 0.3
          ];
          return {
            id: 'live_m_' + idx,
            title: e['im:name'] ? e['im:name'].label : 'Movie ' + (idx + 1),
            year: parseInt(e['im:releaseDate'] ? e['im:releaseDate'].label.substring(0, 4) : '2026', 10) || 2026,
            genres: [rawGenre],
            genreVector,
            rating: parseFloat((8.0 + (idx === 0 ? 0.9 : Math.max(0.2, 0.9 - idx * 0.05))).toFixed(1)),
            image: e['im:image'] && e['im:image'][2] ? e['im:image'][2].label.replace(/\d+x\d+bb/, '600x600bb') : '',
            description: e.summary ? e.summary.label : 'Trending on global streaming charts today.',
            posterGradients: 'linear-gradient(135deg, #10141f 0%, #1f293d 50%, #0d0f18 100%)',
            isLiveOnline: true,
            source: 'iTunes Global Chart'
          };
        });
      }

      if (resS && resS.feed && resS.feed.entry) {
        tracks = resS.feed.entry.map((e, idx) => {
          const rawGenre = e.category && e.category.attributes ? e.category.attributes.label : 'Pop';
          const isDance = rawGenre.includes('Pop') || rawGenre.includes('Dance');
          const isRock = rawGenre.includes('Rock') || rawGenre.includes('Alternative');
          const isHipHop = rawGenre.includes('Hip-Hop') || rawGenre.includes('Rap');

          return {
            id: 'live_s_' + idx,
            title: e['im:name'] ? e['im:name'].label : 'Track ' + (idx + 1),
            artist: e['im:artist'] ? e['im:artist'].label : 'Artist',
            genre: rawGenre,
            duration: '3:30',
            image: e['im:image'] && e['im:image'][2] ? e['im:image'][2].label.replace(/\d+x\d+bb/, '600x600bb') : '',
            coverGradient: 'linear-gradient(135deg, #093b22 0%, #064e3b 50%, #031e17 100%)',
            features: {
              danceability: isDance ? 0.82 : isHipHop ? 0.88 : 0.55,
              energy: isRock ? 0.90 : isDance ? 0.85 : 0.65,
              valence: isDance ? 0.78 : 0.60,
              acousticness: rawGenre.includes('Classical') ? 0.90 : 0.15,
              instrumentalness: 0.05,
              tempo: 0.65
            },
            isLiveOnline: true,
            source: 'Apple Music Global Top Songs'
          };
        });
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        moviesCount: movies.length,
        tracksCount: tracks.length,
        movies,
        tracks
      }));
    }).catch(err => {
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: err.message }));
    });
    return;
  }

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(__dirname, reqPath);

  // Security: prevent path traversal out of root
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500);
      }
      res.end();
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const url = `http://localhost:${PORT}/`;
  console.log('========================================================');
  console.log(`  StreamPulse DAA Web Server active at: ${url}`);
  console.log(`  Academic Report: ${url}report.html`);
  console.log(`  Press Ctrl+C to stop.`);
  console.log('========================================================');

  // Open browser automatically on Windows
  exec(`start ${url}`);
});
