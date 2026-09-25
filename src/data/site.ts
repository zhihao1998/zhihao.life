export type BioPart =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; href: string };

export const site = {
  name: 'Zhihao Wang',
  nameZh: '王志浩',
  title: 'Zhihao Wang',
  description:
    'Postdoctoral Researcher at SANDS Lab, KAUST. Computer networks, observability, and agentic AI for networking.',
  url: 'https://zhihao.life',
  /** Split so the live HTML never contains a literal email address. */
  emailUser: 'zhihao.wang',
  emailDomain: 'kaust.edu.sa',
  links: {
    github: 'https://github.com/zhihao1998',
    scholar: 'https://scholar.google.com/citations?user=se6SXC8AAAAJ&hl=en',
    linkedin: 'https://www.linkedin.com/in/zhihao-wang-17358b2a3',
    sands: 'https://sands.kaust.edu.sa/',
    kaust: 'https://www.kaust.edu.sa/',
    smartdata: 'https://smartdata.polito.it/',
    polito: 'https://www.polito.it/',
    uestc: 'https://en.uestc.edu.cn/',
    canini: 'https://mcanini.github.io/',
    mellia: 'https://www.telematica.polito.it/member/marco-mellia/',
    jiang: 'https://ieeexplore.ieee.org/author/37653012100',
  },
  /** Linked bio paragraphs (About + homepage). */
  bioParagraphs: [
    [
      { type: 'text', value: 'I am a Postdoctoral Researcher in the ' },
      { type: 'link', value: 'SANDS Lab', href: 'https://sands.kaust.edu.sa/' },
      {
        type: 'text',
        value: ' at King Abdullah University of Science and Technology (KAUST), working with ',
      },
      {
        type: 'link',
        value: 'Prof. Marco Canini',
        href: 'https://mcanini.github.io/',
      },
      {
        type: 'text',
        value:
          '. My research sits at the intersection of networking and AI, with a focus on network observability, programmable networks, AI4NetOps, and LLM agents for network troubleshooting.',
      },
    ],
    [
      {
        type: 'text',
        value:
          'I received my Ph.D. in Control Science and Engineering from the ',
      },
      {
        type: 'link',
        value: 'University of Electronic Science and Technology of China (UESTC)',
        href: 'https://en.uestc.edu.cn/',
      },
      { type: 'text', value: ' (2019–2026). From Nov. 2023 to Nov. 2025 I was a visiting Ph.D. student at the ' },
      {
        type: 'link',
        value: 'SmartData@PoliTO',
        href: 'https://smartdata.polito.it/',
      },
      { type: 'text', value: ' center, Politecnico di Torino, working with ' },
      {
        type: 'link',
        value: 'Prof. Marco Mellia',
        href: 'https://www.telematica.polito.it/member/marco-mellia/',
      },
      {
        type: 'text',
        value:
          ' on programmable platforms for network traffic collection and analysis.',
      },
    ],
    [
      {
        type: 'text',
        value:
          'Outside the lab, I photograph, hike, cycle, and swim.',
      },
    ],
  ] as BioPart[][],
  nav: [
    { href: '/about/', label: 'About' },
    { href: '/publications/', label: 'Publications' },
    { href: '/projects/', label: 'Projects' },
    { href: '/news/', label: 'News' },
    { href: '/portfolio/', label: 'Portfolio' },
    { href: '/reel/', label: 'Reel' },
  ],
} as const;
