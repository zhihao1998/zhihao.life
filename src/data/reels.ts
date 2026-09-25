export type Reel =
  | {
      title: string;
      provider: 'bilibili';
      id: string;
    }
  | {
      title: string;
      provider: 'youku';
      id: string;
      url?: string;
    }
  | {
      title: string;
      provider: 'wechat';
      url: string;
    };

export const reels: Reel[] = [
  {
    title: 'Montparnasse, Paris',
    provider: 'bilibili',
    id: 'BV1w6421g789',
  },
  {
    title: 'Pompidou, Paris',
    provider: 'bilibili',
    id: 'BV1CC41147tM',
  },
  {
    title: 'UPC Graduation Film (2019)',
    provider: 'bilibili',
    id: 'BV1n441127AU',
  },
  {
    title: '大航海时代乡村夏令营总结视频',
    provider: 'youku',
    id: 'XMjk5MTM3OTY0NA==',
    url: 'https://v.youku.com/v_show/id_XMjk5MTM3OTY0NA==.html',
  },
  {
    title: 'After Effects work',
    provider: 'wechat',
    url: 'https://weixin.qq.com/sph/AbcrgZPggc',
  },
];
