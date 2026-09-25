export type Publication = {
  id: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  /** Short venue label for teaser fallback (e.g. ToN, IMC). */
  venueShort: string;
  type: 'journal' | 'conference' | 'workshop' | 'preprint' | 'poster';
  featured?: boolean;
  /** Optional preview image under /pubs/ (first-page or figure). */
  teaser?: string;
  links?: {
    pdf?: string;
    arxiv?: string;
    code?: string;
    doi?: string;
    scholar?: string;
  };
};

/** Bold your name in rendering when author === 'Zhihao Wang' */
export const publications: Publication[] = [
  {
    id: 'chamaleonet-ton26',
    title:
      'ChamaleoNet: Programmable Passive Probe for Enhanced Visibility on Erroneous Traffic',
    authors: [
      'Zhihao Wang',
      'Alessandro Cornacchia',
      'Andrea Bianco',
      'Idílio Drago',
      'Paolo Giaccone',
      'Dingde Jiang',
      'Marco Mellia',
    ],
    year: 2026,
    venue: 'IEEE Transactions on Networking',
    venueShort: 'ToN',
    type: 'journal',
    featured: true,
    teaser: '/pubs/chamaleonet.png',
    links: {
      doi: 'https://doi.org/10.1109/ton.2026.3723852',
      arxiv: 'https://arxiv.org/abs/2508.12496',
      pdf: 'https://arxiv.org/pdf/2508.12496',
      code: 'https://github.com/zhihao1998/ChamaleoNet',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:8k81kl-MbHgC',
    },
  },
  {
    id: 'eagle-apnet26',
    title:
      'EAGLE: Erroneous Traffic Analysis Framework using Graph Representation Learning',
    authors: ['Xiaoxiong Yang', 'Zhihao Wang', 'Dingde Jiang'],
    year: 2026,
    venue: 'Proc. Asia-Pacific Workshop on Networking (APNet’26), pp. 109–114',
    venueShort: 'APNet',
    type: 'workshop',
    links: {
      doi: 'https://doi.org/10.1145/3820441.3820457',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:kNdYIx-mwKoC',
    },
  },
  {
    id: 'semantic-icme26',
    title:
      'Leveraging Pre-Trained Models for SDWN-Enabled Semantic Communication System',
    authors: ['Xiaoxiong Yang', 'Zhihao Wang', 'Dingde Jiang', 'Zhihan Lyu'],
    year: 2026,
    venue: 'Proc. IEEE ICME’26 Workshops (to appear)',
    venueShort: 'ICME',
    type: 'workshop',
  },
  {
    id: 'network-arena-arxiv25',
    title:
      'A Network Arena for Benchmarking AI Agents on Network Troubleshooting',
    authors: [
      'Zhihao Wang',
      'Alessandro Cornacchia',
      'Alessio Sacco',
      'Franco Galante',
      'Marco Canini',
      'Dingde Jiang',
    ],
    year: 2025,
    venue: 'arXiv:2512.16381',
    venueShort: 'arXiv',
    type: 'preprint',
    featured: true,
    teaser: '/pubs/network-arena.png',
    links: {
      arxiv: 'https://arxiv.org/abs/2512.16381',
      pdf: 'https://arxiv.org/pdf/2512.16381',
      code: 'https://github.com/sands-lab/nika',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:3fE2CSJIrl8C',
    },
  },
  {
    id: 'imc-poster25',
    title:
      'Poster: The Potential of Erroneous Outbound Traffic Analysis to Unveil Silent Internal Anomalies',
    authors: [
      'Andrea Sordello',
      'Zhihao Wang',
      'Kai Huang',
      'Alessandro Cornacchia',
      'Marco Mellia',
    ],
    year: 2025,
    venue: 'Proc. ACM Internet Measurement Conference (IMC’25), pp. 1078–1079',
    venueShort: 'IMC',
    type: 'poster',
    links: {
      doi: 'https://doi.org/10.1145/3730567.3768599',
      pdf: 'https://dl.acm.org/doi/pdf/10.1145/3730567.3768599',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:MXK_kJrjxJIC',
    },
  },
  {
    id: 'llm4netlab-sigcomm25',
    title:
      'Towards a Playground to Democratize Experimentation and Benchmarking of AI Agents for Network Troubleshooting',
    authors: [
      'Zhihao Wang',
      'Alessandro Cornacchia',
      'Franco Galante',
      'Carlo Centofanti',
      'Alessio Sacco',
      'Dingde Jiang',
    ],
    year: 2025,
    venue: 'Proc. SIGCOMM’25 NGNO Workshop',
    venueShort: 'NGNO',
    type: 'workshop',
    featured: true,
    teaser: '/pubs/llm4netlab.png',
    links: {
      arxiv: 'https://arxiv.org/abs/2507.01997',
      pdf: 'https://arxiv.org/pdf/2507.01997',
      doi: 'https://doi.org/10.1145/3748496.3748990',
      code: 'https://github.com/sands-lab/nika',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:5nxA0vEk-isC',
    },
  },
  {
    id: 'nt-dtn-tmc25',
    title:
      'Network-Wide Data Collection Based on In-Band Network Telemetry for Digital Twin Networks',
    authors: ['Zhihao Wang', 'Dingde Jiang', 'Shahid Mumtaz'],
    year: 2025,
    venue: 'IEEE Transactions on Mobile Computing, 24(1), 86–101',
    venueShort: 'TMC',
    type: 'journal',
    featured: true,
    links: {
      doi: 'https://doi.org/10.1109/tmc.2024.3456584',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:Se3iqnhoufwC',
    },
  },
  {
    id: 'synthetic-ntn-iot25',
    title:
      'Towards Synthetic Network Traffic Generating in NTN-Enabled IoT: A Generative AI Approach',
    authors: [
      'Dingde Jiang',
      'Zhihao Wang',
      'Xinhui Liu',
      'Qi Xu',
      'Tao Zou',
      'Ruyun Zhang',
      'Lizhuang Tan',
      'Peiying Zhang',
    ],
    year: 2024,
    venue: 'IEEE Internet of Things Journal, 12(5), 2174–2187',
    venueShort: 'IoTJ',
    type: 'journal',
    links: {
      doi: 'https://doi.org/10.1109/jiot.2024.3468209',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:0EnyYjriUFMC',
    },
  },
  {
    id: 'blockchain-ids-iiot24',
    title:
      'A Blockchain-Reinforced Federated Intrusion Detection Architecture for IIoT',
    authors: [
      'Dingde Jiang',
      'Zhihao Wang',
      'Ye Wang',
      'Lizhuang Tan',
      'J. Wang',
      'Peiying Zhang',
    ],
    year: 2024,
    venue: 'IEEE Internet of Things Journal, 11(16), 26793–26805',
    venueShort: 'IoTJ',
    type: 'journal',
    links: {
      doi: 'https://doi.org/10.1109/jiot.2024.3406602',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:LkGwnXOMwfcC',
    },
  },
  {
    id: 'gp-int-icc24',
    title:
      'GP-INT: Generating Balanced Network-Wide In-Band Telemetry Path for Digital Twin Networks',
    authors: ['Zhihao Wang', 'Dingde Jiang', 'Kaiwen Zhang'],
    year: 2024,
    venue: 'Proc. IEEE ICC’24, pp. 1109–1114',
    venueShort: 'ICC',
    type: 'conference',
    links: {
      doi: 'https://doi.org/10.1109/icc51166.2024.10622449',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:roLk4NBRz8UC',
    },
  },
  {
    id: 'service-continuity-tvt23',
    title:
      'Service Continuity-Based Data Delivery Optimization in Satellite-Terrestrial Networks',
    authors: ['Feng Wang', 'Dingde Jiang', 'Zhihao Wang', 'Shahid Mumtaz'],
    year: 2023,
    venue: 'IEEE Transactions on Vehicular Technology, 72(10), 13604–13617',
    venueShort: 'TVT',
    type: 'journal',
    links: {
      doi: 'https://doi.org/10.1109/tvt.2023.3277809',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:ufrVoPGSRksC',
    },
  },
  {
    id: 'leo-handover-tcom22',
    title:
      'Seamless Handover in LEO-Based Non-Terrestrial Networks: Service Continuity and Optimization',
    authors: [
      'Feng Wang',
      'Dingde Jiang',
      'Zhihao Wang',
      'Jianguang Chen',
      'Tony Q. S. Quek',
    ],
    year: 2022,
    venue: 'IEEE Transactions on Communications, 71(2), 1008–1023',
    venueShort: 'TCOM',
    type: 'journal',
    links: {
      doi: 'https://doi.org/10.1109/tcomm.2022.3229014',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:_FxGoFyzp5QC',
    },
  },
  {
    id: 'trustworthy-iiot-tii22',
    title:
      'AI-Assisted Trustworthy Architecture for Industrial IoT Based on Dynamic Heterogeneous Redundancy',
    authors: ['Zhihao Wang', 'Dingde Jiang', 'Zhihan Lv'],
    year: 2022,
    venue: 'IEEE Transactions on Industrial Informatics, 19(2), 2019–2027',
    venueShort: 'TII',
    type: 'journal',
    links: {
      doi: 'https://doi.org/10.1109/tii.2022.3210139',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:YsMSGLbcyi4C',
    },
  },
  {
    id: 'drl-ids-infocom22',
    title:
      'A Deep Reinforcement Learning-Based Intrusion Detection Strategy for Smart Vehicular Networks',
    authors: ['Zhihao Wang', 'Dingde Jiang', 'Zhihan Lv', 'Houbing Song'],
    year: 2022,
    venue: 'Proc. IEEE INFOCOM’22 Workshops',
    venueShort: 'INFOCOM',
    type: 'workshop',
    links: {
      doi: 'https://doi.org/10.1109/infocomwkshps54753.2022.9798344',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:eQOLeE2rZwMC',
    },
  },
  {
    id: 'ai-routing-tnse22',
    title:
      'AI-Assisted Energy-Efficient and Intelligent Routing for Reconfigurable Wireless Networks',
    authors: [
      'Dingde Jiang',
      'Zhihao Wang',
      'Wenjuan Wang',
      'Zhihan Lv',
      'Kim-Kwang Raymond Choo',
    ],
    year: 2022,
    venue: 'IEEE Transactions on Network Science and Engineering, 9(1), 78–88',
    venueShort: 'TNSE',
    type: 'journal',
    links: {
      doi: 'https://doi.org/10.1109/tnse.2021.3075428',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:9yKSN-GCB0IC',
    },
  },
  {
    id: 'fuzzy-cnn-routing-tvt21',
    title:
      'Fuzzy-CNN Based Multi-Task Routing for Integrated Satellite-Terrestrial Networks',
    authors: [
      'Feng Wang',
      'Dingde Jiang',
      'Zhihao Wang',
      'Zhihan Lv',
      'Shahid Mumtaz',
    ],
    year: 2021,
    venue: 'IEEE Transactions on Vehicular Technology, 71(2), 1913–1926',
    venueShort: 'TVT',
    type: 'journal',
    links: {
      doi: 'https://doi.org/10.1109/tvt.2021.3131975',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:Y0pCki6q_DkC',
    },
  },
  {
    id: 'mimicry-simutools21',
    title:
      'Deep Reinforcement Learning-Based Mimicry Defense System for IoT Message Transmission',
    authors: ['Zhihao Wang', 'Dingde Jiang', 'Jianguang Chen', 'Wei Yang'],
    year: 2021,
    venue: 'Proc. SIMUtools’21, pp. 421–431',
    venueShort: 'SIMU',
    type: 'conference',
    links: {
      doi: 'https://doi.org/10.1007/978-3-030-97124-3_31',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:WF5omc3nYNoC',
    },
  },
  {
    id: 'leo-pathfinding-vtc21',
    title:
      'Time-Extended Pathfinding Optimization in Mobile LEO Satellite Communication Networks',
    authors: [
      'Feng Wang',
      'Dingde Jiang',
      'Zhihao Wang',
      'Haibin Lv',
      'Zhihan Lv',
    ],
    year: 2021,
    venue: 'Proc. IEEE VTC’21-Fall',
    venueShort: 'VTC',
    type: 'conference',
    links: {
      doi: 'https://doi.org/10.1109/vtc2021-fall52928.2021.9625576',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:W7OEmFMy1HYC',
    },
  },
  {
    id: 'polymorphic-smartgrid-scs21',
    title:
      'A Polymorphic Heterogeneous Security Architecture for Edge-Enabled Smart Grids',
    authors: [
      'Zhihao Wang',
      'Dingde Jiang',
      'Feng Wang',
      'Zhihan Lv',
      'Robert Nowak',
    ],
    year: 2021,
    venue: 'Sustainable Cities and Society, 67, 102661',
    venueShort: 'SCS',
    type: 'journal',
    links: {
      doi: 'https://doi.org/10.1016/j.scs.2020.102661',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:u-x6o8ySG0sC',
    },
  },
  {
    id: 'sdn-iov-tits21',
    title:
      'A Performance Measurement and Analysis Method for Software-Defined Networking of IoV',
    authors: ['Dingde Jiang', 'Zhihao Wang', 'Liuwei Huo', 'Shaowei Xie'],
    year: 2021,
    venue: 'IEEE Transactions on Intelligent Transportation Systems, 22(6), 3707–3719',
    venueShort: 'TITS',
    type: 'journal',
    links: {
      doi: 'https://doi.org/10.1109/tits.2020.3029076',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:d1gkVwhDpl0C',
    },
  },
  {
    id: 'mec-sdn-icccn20',
    title:
      'Research on Design and Application of Mobile Edge Computing Model Based on SDN',
    authors: [
      'Shaohua Cao',
      'Zhihao Wang',
      'Yizhi Chen',
      'Dingde Jiang',
      'Yang Yan',
      'Hui Chen',
    ],
    year: 2020,
    venue: 'Proc. ICCCN’20',
    venueShort: 'ICCCN',
    type: 'conference',
    links: {
      doi: 'https://doi.org/10.1109/icccn49398.2020.9209601',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:2osOgNQ5qMEC',
    },
  },
  {
    id: 'drone-dsa-infocom20',
    title:
      'Smart Antenna-Based Multi-Hop Highly-Energy-Efficient DSA Approach to Drone-Assisted Backhaul Networks for 5G',
    authors: ['Dingde Jiang', 'Zhihao Wang', 'Zhihan Lv', 'Wenpan Li'],
    year: 2020,
    venue: 'Proc. IEEE INFOCOM’20 Workshops',
    venueShort: 'INFOCOM',
    type: 'workshop',
    links: {
      doi: 'https://doi.org/10.1109/infocomwkshps50562.2020.9162848',
      scholar:
        'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=se6SXC8AAAAJ&citation_for_view=se6SXC8AAAAJ:u5HHmVD_uO8C',
    },
  },
];

export function publicationsByYear(list = publications) {
  const years = [...new Set(list.map((p) => p.year))].sort((a, b) => b - a);
  return years.map((year) => ({
    year,
    items: list.filter((p) => p.year === year),
  }));
}

export function featuredPublications(limit = 2) {
  return publications.filter((p) => p.featured).slice(0, limit);
}
