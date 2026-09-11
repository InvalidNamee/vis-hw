export interface Homework {
  id: string;
  number: number;
  title: string;
  description: string;
  ready: boolean;
  /** Optional image path relative to public/, e.g. covers/hw01.webp. */
  cover?: string;
  coverAlt?: string;
}

export const homework: Homework[] = Array.from({ length: 10 }, (_, i) => ({
  id: `hw${String(i + 1).padStart(2, '0')}`,
  number: i + 1,
  title: i === 0 ? '网页空间布局' : `作业 ${String(i + 1).padStart(2, '0')}`,
  description: i === 0 ? '从盒模型到 Grid 与 Flex，构建清晰、自适应的网页空间。' : '本章内容将在后续作业中更新。',
  ready: i === 0,
}));

export const href = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
