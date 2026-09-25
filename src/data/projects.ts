export type ProjectLink = { label: string; href: string };

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  status: string;
  period: string;
  summary: string[];
  highlights: string[];
  collaborators?: string[];
  venues?: string[];
  teaser?: string;
  links: ProjectLink[];
  /** News slugs associated with this project. */
  news: string[];
};

export const projects: Project[] = [
  {
    slug: 'nika',
    name: 'NIKA',
    tagline:
      'Network Incident Benchmark for AI Agents',
    status: 'Active',
    period: '2025 – present',
    summary: [
      'NIKA (Network Incident Benchmark for AI Agents) is an open platform for benchmarking AI agents on realistic network troubleshooting tasks—think SWE-Bench, but for network engineers.',
      'It deploys live emulated networks (Kathará, Containerlab), injects realistic faults, exposes MCP tools and telemetry, and evaluates agent submissions under reproducible conditions.',
    ],
    highlights: [
      'Hundreds of reproducible incidents across data center, campus, ISP, SDN, and Kubernetes scenarios',
      'Bring any agent framework; sandboxed tool access to CLIs, telemetry, and diagnostics',
      'Public website, leaderboard, and nika-bench releases for comparable results',
    ],
    collaborators: [
      'SANDS Lab, KAUST',
      'Politecnico di Torino collaborators',
    ],
    venues: ['ACM SIGCOMM’25 NGNO', 'arXiv preprint'],
    teaser: '/projects/nika-architecture.jpg',
    links: [
      { label: 'Website', href: 'https://sands-lab.github.io/nika/' },
      {
        label: 'Leaderboard',
        href: 'https://sands-lab.github.io/nika/leaderboard/',
      },
      { label: 'Code', href: 'https://github.com/sands-lab/nika' },
      { label: 'arXiv', href: 'https://arxiv.org/abs/2512.16381' },
      { label: 'DOI (NGNO)', href: 'https://doi.org/10.1145/3748496.3748990' },
    ],
    news: [
      '2026-nika-leaderboard',
      '2026-nika-website',
      '2025-network-arena',
      '2025-sigcomm-ngno',
    ],
  },
  {
    slug: 'chamaleonet',
    name: 'ChamaleoNet',
    tagline:
      'Programmable passive probe for visibility on erroneous traffic',
    status: 'Active',
    period: '2024 – present',
    summary: [
      'ChamaleoNet turns production networks into telescopes for erroneous and unsolicited traffic—capturing internal radiation that classic darknet monitors miss.',
      'It combines P4 in-hardware filtering, a C-based VNF for buffering and anomaly handling, and DPDK anonymization, and has been running on the Politecnico di Torino campus network for over 1.5 years.',
    ],
    highlights: [
      'Service-level telescope beyond unused dark address space',
      'Open-source P4 + VNF pipeline with privacy-preserving collection',
      'Follow-on analysis in IMC’25 poster and APNet’26 (EAGLE)',
    ],
    collaborators: ['SmartData@PoliTO', 'Politecnico di Torino', 'UESTC'],
    venues: ['IEEE ToN 2026', 'ACM IMC’25 Poster', 'APNet’26'],
    teaser: '/projects/chamaleonet-live.jpg',
    links: [
      { label: 'Code', href: 'https://github.com/zhihao1998/ChamaleoNet' },
      { label: 'arXiv', href: 'https://arxiv.org/abs/2508.12496' },
      { label: 'DOI (ToN)', href: 'https://doi.org/10.1109/ton.2026.3723852' },
      {
        label: 'DOI (IMC Poster)',
        href: 'https://doi.org/10.1145/3730567.3768599',
      },
    ],
    news: [
      '2026-chamaleonet-ton',
      '2026-eagle-apnet',
      '2025-imc-poster',
    ],
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
