/**
 * Spotify Tracks Dataset with High-Dimensional Audio Features
 * Features normalized between 0.0 and 1.0 (matching Spotify Web API specifications):
 * - Danceability: suitability for dancing based on tempo, rhythm stability, beat strength
 * - Energy: perceptual measure of intensity and activity
 * - Valence: musical positiveness conveyed (happy/euphoric vs sad/depressed)
 * - Acousticness: confidence measure of whether track is acoustic
 * - Instrumentalness: predicts whether a track contains no vocals
 * - Tempo: normalized tempo (relative to 60-180 BPM range)
 */

export const AUDIO_FEATURE_KEYS = [
  "danceability",
  "energy",
  "valence",
  "acousticness",
  "instrumentalness",
  "tempo"
];

export const TRACKS = [
  {
    id: "t1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    year: 2020,
    genre: "Synthwave / Pop",
    features: {
      danceability: 0.82,
      energy: 0.86,
      valence: 0.65,
      acousticness: 0.08,
      instrumentalness: 0.02,
      tempo: 0.72 // ~171 BPM
    },
    duration: "3:20",
    image: "assets/images/tracks/blinding-lights.jpg",
    coverGradient: "linear-gradient(135deg, #e74c3c 0%, #c0392b 50%, #1a0507 100%)",
    accentColor: "#e74c3c"
  },
  {
    id: "t2",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    album: "Starboy",
    year: 2016,
    genre: "Electro R&B",
    features: {
      danceability: 0.78,
      energy: 0.79,
      valence: 0.58,
      acousticness: 0.14,
      instrumentalness: 0.01,
      tempo: 0.62 // ~186/93 BPM
    },
    duration: "3:50",
    image: "assets/images/tracks/starboy.jpg",
    coverGradient: "linear-gradient(135deg, #3498db 0%, #1a5276 50%, #0c1824 100%)",
    accentColor: "#3498db"
  },
  {
    id: "t3",
    title: "As It Was",
    artist: "Harry Styles",
    album: "Harry's House",
    year: 2022,
    genre: "Indie Pop",
    features: {
      danceability: 0.74,
      energy: 0.73,
      valence: 0.76,
      acousticness: 0.28,
      instrumentalness: 0.00,
      tempo: 0.68 // ~174 BPM
    },
    duration: "2:47",
    image: "assets/images/tracks/as-it-was.jpg",
    coverGradient: "linear-gradient(135deg, #e67e22 0%, #d35400 50%, #210d02 100%)",
    accentColor: "#e67e22"
  },
  {
    id: "t4",
    title: "bad guy",
    artist: "Billie Eilish",
    album: "WHEN WE ALL FALL ASLEEP",
    year: 2019,
    genre: "Electropop / Bass",
    features: {
      danceability: 0.88,
      energy: 0.54,
      valence: 0.68,
      acousticness: 0.33,
      instrumentalness: 0.13,
      tempo: 0.55 // ~135 BPM
    },
    duration: "3:14",
    image: "assets/images/tracks/bad-guy.jpg",
    coverGradient: "linear-gradient(135deg, #f1c40f 0%, #9a7d0a 50%, #1a1602 100%)",
    accentColor: "#f1c40f"
  },
  {
    id: "t5",
    title: "Clair de Lune",
    artist: "Claude Debussy",
    album: "Suite Bergamasque",
    year: 1905,
    genre: "Impressionist Classical",
    features: {
      danceability: 0.18,
      energy: 0.09,
      valence: 0.12,
      acousticness: 0.98,
      instrumentalness: 0.94,
      tempo: 0.25 // ~65 BPM
    },
    duration: "5:04",
    image: "assets/images/tracks/clair-de-lune.jpg",
    coverGradient: "linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #111a24 100%)",
    accentColor: "#5dade2"
  },
  {
    id: "t6",
    title: "Experience",
    artist: "Ludovico Einaudi",
    album: "In a Time Lapse",
    year: 2013,
    genre: "Neoclassical / Piano",
    features: {
      danceability: 0.28,
      energy: 0.42,
      valence: 0.22,
      acousticness: 0.89,
      instrumentalness: 0.91,
      tempo: 0.44 // ~92 BPM
    },
    duration: "5:15",
    image: "assets/images/tracks/experience.jpg",
    coverGradient: "linear-gradient(135deg, #4a235a 0%, #2e1138 50%, #16061c 100%)",
    accentColor: "#af7ac5"
  },
  {
    id: "t7",
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    year: 2011,
    genre: "Dream Pop / Synthwave",
    features: {
      danceability: 0.61,
      energy: 0.84,
      valence: 0.45,
      acousticness: 0.05,
      instrumentalness: 0.32,
      tempo: 0.51 // ~105 BPM
    },
    duration: "4:03",
    image: "assets/images/tracks/midnight-city.jpg",
    coverGradient: "linear-gradient(135deg, #8e44ad 0%, #6c3483 50%, #1b0a24 100%)",
    accentColor: "#9b59b6"
  },
  {
    id: "t8",
    title: "Strobe",
    artist: "deadmau5",
    album: "For Lack of a Better Name",
    year: 2009,
    genre: "Progressive House",
    features: {
      danceability: 0.65,
      energy: 0.78,
      valence: 0.31,
      acousticness: 0.03,
      instrumentalness: 0.88,
      tempo: 0.58 // ~128 BPM
    },
    duration: "10:37",
    image: "assets/images/tracks/strobe.jpg",
    coverGradient: "linear-gradient(135deg, #16a085 0%, #117864 50%, #051d18 100%)",
    accentColor: "#1abc9c"
  },
  {
    id: "t9",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    year: 2020,
    genre: "Nu-Disco / Dance Pop",
    features: {
      danceability: 0.89,
      energy: 0.85,
      valence: 0.88,
      acousticness: 0.07,
      instrumentalness: 0.00,
      tempo: 0.56 // ~124 BPM
    },
    duration: "3:23",
    image: "assets/images/tracks/levitating.jpg",
    coverGradient: "linear-gradient(135deg, #1db954 0%, #147936 50%, #051c0d 100%)",
    accentColor: "#1db954"
  },
  {
    id: "t10",
    title: "Someone Like You",
    artist: "Adele",
    album: "21",
    year: 2011,
    genre: "Soul / Ballad",
    features: {
      danceability: 0.39,
      energy: 0.32,
      valence: 0.27,
      acousticness: 0.89,
      instrumentalness: 0.00,
      tempo: 0.36 // ~67 BPM
    },
    duration: "4:45",
    image: "assets/images/tracks/someone-like-you.jpg",
    coverGradient: "linear-gradient(135deg, #784212 0%, #4d2a0b 50%, #1a0e04 100%)",
    accentColor: "#d35400"
  },
  {
    id: "t11",
    title: "God's Plan",
    artist: "Drake",
    album: "Scorpion",
    year: 2018,
    genre: "Hip-Hop / Trap",
    features: {
      danceability: 0.84,
      energy: 0.62,
      valence: 0.49,
      acousticness: 0.16,
      instrumentalness: 0.00,
      tempo: 0.41 // ~77 BPM
    },
    duration: "3:19",
    image: "assets/images/tracks/gods-plan.jpg",
    coverGradient: "linear-gradient(135deg, #2c3e50 0%, #1b2631 50%, #0c1117 100%)",
    accentColor: "#85929e"
  },
  {
    id: "t12",
    title: "Weightless",
    artist: "Marconi Union",
    album: "Ambient Transmissions",
    year: 2011,
    genre: "Ambient / Relaxation",
    features: {
      danceability: 0.12,
      energy: 0.08,
      valence: 0.09,
      acousticness: 0.94,
      instrumentalness: 0.96,
      tempo: 0.23 // ~60 BPM
    },
    duration: "8:08",
    image: "assets/images/tracks/weightless.jpg",
    coverGradient: "linear-gradient(135deg, #0e6655 0%, #0b4539 50%, #031411 100%)",
    accentColor: "#48c9b0"
  }
];
