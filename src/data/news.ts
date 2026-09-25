export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  body: string[];
  /** Optional project slug this update belongs to. */
  project?: string;
  links?: { label: string; href: string }[];
};

export const news: NewsItem[] = [
  {
    slug: '2026-nika-leaderboard',
    title: 'NIKA public leaderboard and nika-bench 0.2.0',
    date: '2026-09-01',
    project: 'nika',
    summary:
      'We published nika-bench 0.2.0 and opened a public leaderboard for comparable agent runs on network troubleshooting.',
    body: [
      'nika-bench 0.2.0 freezes Dev/Test splits for official evaluation. Leaderboard scoring uses rule-based RCA F1; submissions can pack trajectories and open a Hugging Face dataset PR.',
      'The leaderboard site ranks agent performance under the frozen release. Earlier, nika-bench 0.1.0 and the submit pipeline landed in July 2026.',
    ],
    links: [
      {
        label: 'Leaderboard',
        href: 'https://sands-lab.github.io/nika/leaderboard/',
      },
      { label: 'Website', href: 'https://sands-lab.github.io/nika/' },
      { label: 'Code', href: 'https://github.com/sands-lab/nika' },
      { label: 'Project', href: '/projects/nika/' },
    ],
  },
  {
    slug: '2026-nika-website',
    title: 'NIKA project website is live',
    date: '2026-07-07',
    project: 'nika',
    summary:
      'The NIKA project site is public, with overview, architecture, and links into the benchmark and code.',
    body: [
      'The site introduces NIKA as a Network Incident Benchmark for AI Agents and points to documentation, the GitHub repo, and later the public leaderboard.',
    ],
    links: [
      { label: 'Website', href: 'https://sands-lab.github.io/nika/' },
      { label: 'Code', href: 'https://github.com/sands-lab/nika' },
      { label: 'Project', href: '/projects/nika/' },
    ],
  },
  {
    slug: '2026-chamaleonet-ton',
    title: 'ChamaleoNet accepted at IEEE Transactions on Networking',
    date: '2026-01-15',
    project: 'chamaleonet',
    summary:
      'Our programmable passive probe for erroneous traffic visibility appears in IEEE ToN, with open code and an arXiv preprint.',
    body: [
      'ChamaleoNet extends the network telescope idea from unused dark space to live production networks, collecting erroneous and unsolicited traffic with P4 filtering and privacy-preserving anonymization.',
      'The system has been deployed on the Politecnico di Torino campus network and enables follow-on studies of silent internal anomalies and automated analysis.',
    ],
    links: [
      { label: 'arXiv', href: 'https://arxiv.org/abs/2508.12496' },
      { label: 'DOI', href: 'https://doi.org/10.1109/ton.2026.3723852' },
      { label: 'Code', href: 'https://github.com/zhihao1998/ChamaleoNet' },
      { label: 'Project', href: '/projects/chamaleonet/' },
    ],
  },
  {
    slug: '2026-eagle-apnet',
    title: 'EAGLE to appear at APNet 2026',
    date: '2026-01-10',
    project: 'chamaleonet',
    summary:
      'EAGLE applies graph representation learning to erroneous traffic collected by ChamaleoNet-style telescopes.',
    body: [
      'Building on erroneous traffic visibility, EAGLE explores automated analysis with graph neural networks and will appear at the Asia-Pacific Workshop on Networking (APNet’26).',
    ],
    links: [
      { label: 'DOI', href: 'https://doi.org/10.1145/3820441.3820457' },
      { label: 'Project', href: '/projects/chamaleonet/' },
    ],
  },
  {
    slug: '2025-network-arena',
    title: 'NIKA preprint released',
    date: '2025-12-18',
    project: 'nika',
    summary:
      'We released a preprint on NIKA, a Network Incident Benchmark for AI Agents on network troubleshooting.',
    body: [
      'The paper describes how NIKA supports reproducible evaluation of LLM agents across network incidents, topologies, and observability settings.',
      'It complements our SIGCOMM’25 NGNO lightning paper on democratizing experimentation with agentic network ops.',
    ],
    links: [
      { label: 'arXiv', href: 'https://arxiv.org/abs/2512.16381' },
      { label: 'Code', href: 'https://github.com/sands-lab/nika' },
      { label: 'Project', href: '/projects/nika/' },
    ],
  },
  {
    slug: '2025-imc-poster',
    title: 'IMC 2025 poster on silent internal anomalies',
    date: '2025-10-28',
    project: 'chamaleonet',
    summary:
      'At ACM IMC’25 we presented a poster on uncovering silent internal anomalies from erroneous outbound traffic.',
    body: [
      'Analyzing traffic collected by our programmable probe revealed diverse silent anomalies inside a campus network—cases that traditional darknet telescopes would miss.',
    ],
    links: [
      { label: 'DOI', href: 'https://doi.org/10.1145/3730567.3768599' },
      { label: 'Project', href: '/projects/chamaleonet/' },
    ],
  },
  {
    slug: '2025-sigcomm-ngno',
    title: 'Paper accepted at ACM SIGCOMM 2025 NGNO Workshop',
    date: '2025-07-01',
    project: 'nika',
    summary:
      'Our lightning paper on a playground for AI agents in network troubleshooting was accepted at SIGCOMM’25 NGNO.',
    body: [
      'As AI agents become more capable of interacting with network environments, we see a growing need for standardized, reproducible, and open platforms that support experimentation and benchmarking.',
      'In this work, we present a modular, extensible playground built on top of existing network emulators like Kathará, designed to simplify the evaluation of AI agents across diverse network scenarios.',
      'Our goal is to call attention to the lack of holistic platforms in this space and to spark discussion around the challenges of benchmarking AI-driven solutions in networking.',
    ],
    links: [
      {
        label: 'Workshop',
        href: 'https://conferences.sigcomm.org/sigcomm/2025/workshop/ngno/',
      },
      { label: 'arXiv', href: 'https://arxiv.org/abs/2507.01997' },
      { label: 'Code', href: 'https://github.com/sands-lab/nika' },
      { label: 'Project', href: '/projects/nika/' },
    ],
  },
];

export function getNews(slug: string) {
  return news.find((n) => n.slug === slug);
}

export function newsForProject(projectSlug: string) {
  return news
    .filter((n) => n.project === projectSlug)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function newsBySlug(slugs: string[]) {
  const map = new Map(news.map((n) => [n.slug, n]));
  return slugs.map((s) => map.get(s)).filter(Boolean) as typeof news;
}
