// Vercel Serverless Function: /api/live-trending
// Proxies iTunes & Apple Music real-time chart feeds with CORS & caching

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const [resM, resS] = await Promise.all([
      fetch('https://itunes.apple.com/us/rss/topmovies/limit=25/json').then(r => r.json()).catch(() => null),
      fetch('https://itunes.apple.com/us/rss/topsongs/limit=25/json').then(r => r.json()).catch(() => null)
    ]);

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

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      moviesCount: movies.length,
      tracksCount: tracks.length,
      movies,
      tracks
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
