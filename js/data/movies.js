/**
 * Netflix Movies Dataset & Initial Rating Matrix
 * Designed for DAA Recommendation System Demonstration
 */

export const MOVIES = [
  {
    id: "m1",
    title: "Stranger Things",
    year: 2016,
    genres: ["Sci-Fi", "Horror", "Drama"],
    genreVector: [0.9, 0.8, 0.7, 0.1, 0.2, 0.3], // [Sci-Fi, Horror, Drama, Comedy, Romance, Action]
    rating: 8.7,
    duration: "4 Seasons",
    matchScore: 98,
    description: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
    tags: ["80s Nostalgia", "Monsters", "Conspiracy", "Teen"],
    colorAccent: "#E50914",
    image: "assets/images/movies/stranger-things.jpg",
    posterGradients: "linear-gradient(135deg, #1f0406 0%, #4a0d13 50%, #0d0f18 100%)",
    artworkVariants: [
      { id: "a1", name: "Demogorgon Horror", targetSegment: "Horror/Thriller", baseCtr: 0.28, tag: "Supernatural Monster", image: "assets/images/movies/stranger-things-demogorgon.jpg" },
      { id: "a2", name: "Bike Squad Friendship", targetSegment: "Drama/Nostalgia", baseCtr: 0.19, tag: "Kids on Bikes", image: "assets/images/movies/stranger-things-bikes.jpg" },
      { id: "a3", name: "Eleven Psychic Stare", targetSegment: "Sci-Fi/Action", baseCtr: 0.34, tag: "Telekinesis Power", image: "assets/images/movies/stranger-things-eleven.jpg" }
    ]
  },
  {
    id: "m2",
    title: "Inception",
    year: 2010,
    genres: ["Sci-Fi", "Action", "Thriller"],
    genreVector: [0.95, 0.2, 0.6, 0.0, 0.1, 0.9],
    rating: 8.8,
    duration: "2h 28m",
    matchScore: 96,
    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    tags: ["Mind-Bending", "Dreams", "Heist", "Time"],
    colorAccent: "#00c3ff",
    image: "assets/images/movies/inception.jpg",
    posterGradients: "linear-gradient(135deg, #02182b 0%, #083b66 50%, #0d121d 100%)",
    artworkVariants: [
      { id: "b1", name: "Folding City Architecture", targetSegment: "Sci-Fi/Spectacle", baseCtr: 0.31, tag: "Gravity Inversion" },
      { id: "b2", name: "Spinning Totem Close-up", targetSegment: "Mystery/Mind", baseCtr: 0.22, tag: "Dream Reality" },
      { id: "b3", name: "Zero-G Corridor Combat", targetSegment: "Action/Heist", baseCtr: 0.36, tag: "Combat Physics" }
    ]
  },
  {
    id: "m3",
    title: "The Queen's Gambit",
    year: 2020,
    genres: ["Drama"],
    genreVector: [0.1, 0.0, 0.95, 0.1, 0.2, 0.1],
    rating: 8.6,
    duration: "1 Season",
    matchScore: 92,
    description: "Orphaned at the tender age of nine, prodigious introvert Beth Harmon discovers and masters the game of chess in 1960s USA, fighting addiction along the way.",
    tags: ["Chess Prodigy", "Period Piece", "Addiction", "Psychological"],
    colorAccent: "#e67e22",
    image: "assets/images/movies/queens-gambit.jpg",
    posterGradients: "linear-gradient(135deg, #2b1705 0%, #6b360a 50%, #151119 100%)",
    artworkVariants: [
      { id: "c1", name: "Beth Piercing Stare", targetSegment: "Drama/Character", baseCtr: 0.33, tag: "Intense Portrait" },
      { id: "c2", name: "Ceiling Dream Chessboard", targetSegment: "Psychological", baseCtr: 0.27, tag: "Ceiling Hallucination" },
      { id: "c3", name: "1960s Moscow Tournament", targetSegment: "Period/Stakes", baseCtr: 0.18, tag: "Cold War Rivalry" }
    ]
  },
  {
    id: "m4",
    title: "Black Mirror",
    year: 2011,
    genres: ["Sci-Fi", "Thriller", "Drama"],
    genreVector: [0.9, 0.5, 0.8, 0.1, 0.0, 0.2],
    rating: 8.7,
    duration: "6 Seasons",
    matchScore: 94,
    description: "An anthology series exploring a twisted, high-tech multiverse where humanity's greatest innovations and darkest instincts collide.",
    tags: ["Dystopian", "Tech Paranoia", "Anthology", "Satire"],
    colorAccent: "#00F0FF",
    image: "assets/images/movies/black-mirror.jpg",
    posterGradients: "linear-gradient(135deg, #091c24 0%, #114254 50%, #0a0e14 100%)",
    artworkVariants: [
      { id: "d1", name: "Cracked Smartphone Screen", targetSegment: "Tech/Dystopia", baseCtr: 0.35, tag: "Shattered Reality" },
      { id: "d2", name: "Robotic Hound Stalker", targetSegment: "Thriller/Action", baseCtr: 0.24, tag: "Metalhead Droid" },
      { id: "d3", name: "Social Rating Star Aura", targetSegment: "Satire/Drama", baseCtr: 0.29, tag: "Nosedive 4.8 Rating" }
    ]
  },
  {
    id: "m5",
    title: "La La Land",
    year: 2016,
    genres: ["Romance", "Drama", "Comedy"],
    genreVector: [0.0, 0.0, 0.7, 0.6, 0.95, 0.1],
    rating: 8.0,
    duration: "2h 8m",
    matchScore: 89,
    description: "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
    tags: ["Musical", "Hollywood", "Bittersweet", "Jazz"],
    colorAccent: "#9b59b6",
    image: "assets/images/movies/la-la-land.jpg",
    posterGradients: "linear-gradient(135deg, #240b2b 0%, #5d1770 50%, #150a1c 100%)",
    artworkVariants: [
      { id: "e1", name: "Twilight Dance Silhouette", targetSegment: "Romance/Musical", baseCtr: 0.38, tag: "Griffith Park Tap" },
      { id: "e2", name: "Sebastian at Grand Piano", targetSegment: "Music/Jazz", baseCtr: 0.21, tag: "Jazz Passion" },
      { id: "e3", name: "Mia Retro Audition Spotlight", targetSegment: "Drama/Dreams", baseCtr: 0.26, tag: "Hollywood Audition" }
    ]
  },
  {
    id: "m6",
    title: "Squid Game",
    year: 2021,
    genres: ["Thriller", "Action", "Drama"],
    genreVector: [0.2, 0.8, 0.8, 0.1, 0.0, 0.85],
    rating: 8.0,
    duration: "1 Season",
    matchScore: 97,
    description: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games. Inside, a tempting prize awaits with deadly high stakes.",
    tags: ["Survival Game", "Social Inequality", "Korean", "Suspense"],
    colorAccent: "#ff007f",
    image: "assets/images/movies/squid-game.jpg",
    posterGradients: "linear-gradient(135deg, #33051a 0%, #7d0d40 50%, #12050b 100%)",
    artworkVariants: [
      { id: "f1", name: "Giant Robotic Doll Eye", targetSegment: "Suspense/Horror", baseCtr: 0.37, tag: "Red Light Green Light" },
      { id: "f2", name: "Pink Masked Soldiers", targetSegment: "Mystery/Action", baseCtr: 0.30, tag: "Square Circle Triangle" },
      { id: "f3", name: "Piggy Bank Gold Shower", targetSegment: "Greed/Thriller", baseCtr: 0.25, tag: "45.6 Billion Won" }
    ]
  },
  {
    id: "m7",
    title: "Interstellar",
    year: 2014,
    genres: ["Sci-Fi", "Drama"],
    genreVector: [0.98, 0.1, 0.85, 0.0, 0.2, 0.5],
    rating: 8.7,
    duration: "2h 49m",
    matchScore: 95,
    description: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet.",
    tags: ["Black Hole", "Space Travel", "Father-Daughter", "Time Dilatation"],
    colorAccent: "#3498db",
    image: "assets/images/movies/interstellar.jpg",
    posterGradients: "linear-gradient(135deg, #071929 0%, #10416b 50%, #060b12 100%)",
    artworkVariants: [
      { id: "g1", name: "Gargantua Black Hole Glow", targetSegment: "Sci-Fi/Cosmos", baseCtr: 0.39, tag: "Singularity Accretion" },
      { id: "g2", name: "Water Planet Mega Wave", targetSegment: "Action/Survival", baseCtr: 0.29, tag: "Miller's Mountain Wave" },
      { id: "g3", name: "Cooper & Murph Farewell", targetSegment: "Emotional/Drama", baseCtr: 0.23, tag: "Family Bond" }
    ]
  },
  {
    id: "m8",
    title: "The Office",
    year: 2005,
    genres: ["Comedy"],
    genreVector: [0.0, 0.0, 0.3, 0.95, 0.4, 0.0],
    rating: 9.0,
    duration: "9 Seasons",
    matchScore: 91,
    description: "A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium at Dunder Mifflin.",
    tags: ["Mockumentary", "Cringe Comedy", "Workplace", "Comfort TV"],
    colorAccent: "#f1c40f",
    image: "assets/images/movies/the-office.jpg",
    posterGradients: "linear-gradient(135deg, #261f03 0%, #63500a 50%, #121005 100%)",
    artworkVariants: [
      { id: "h1", name: "Michael Scott Finger Guns", targetSegment: "Comedy/Michael", baseCtr: 0.35, tag: "Worlds Best Boss" },
      { id: "h2", name: "Jim Halpert Camera Glance", targetSegment: "Meme/Relatable", baseCtr: 0.32, tag: "Jim Smirk" },
      { id: "h3", name: "Jim & Pam Wedding Whisper", targetSegment: "Romance/Feel-Good", baseCtr: 0.27, tag: "Jam Romance" }
    ]
  }
];

// Curated Sparse Rating Matrix (6 Users x 8 Movies)
// Missing values represented as null (to be predicted via SVD/Matrix Factorization)
export const USER_NAMES = [
  "You (Active Profile)",
  "Alex (Sci-Fi Specialist)",
  "Sarah (Drama & Romance)",
  "David (Cinephile Critic)",
  "Elena (Dark Thrillers)",
  "Marcus (Sitcom & Binge)"
];

export const INITIAL_RATINGS = [
  // User 0 (You): Likes Inception & Interstellar, hasn't seen Stranger Things or Queen's Gambit
  [null, 5.0, null, 4.5, 2.0, null, 5.0, 3.0],
  // User 1 (Alex - Sci-Fi): High on Stranger Things, Inception, Black Mirror, Interstellar
  [5.0, 5.0, 3.0, 5.0, 1.0, 4.0, 5.0, 2.0],
  // User 2 (Sarah - Drama & Romance): High on Queen's Gambit, La La Land, The Office
  [3.0, 2.0, 5.0, 2.0, 5.0, 2.0, 3.0, 5.0],
  // User 3 (David - Cinephile): Broad high ratings
  [4.0, 5.0, 5.0, 4.0, 4.0, 4.0, 5.0, null],
  // User 4 (Elena - Thriller): High on Squid Game, Black Mirror, Stranger Things
  [5.0, 4.0, 4.0, 5.0, 2.0, 5.0, null, 2.0],
  // User 5 (Marcus - Comedy): High on The Office, La La Land, Squid Game
  [3.0, 3.0, null, 3.0, 4.0, 4.0, 2.0, 5.0]
];
