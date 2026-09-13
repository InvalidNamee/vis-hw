export interface Homework {
  id: string;
  number: number;
  /** 章节名。作业尚未添加时没有名称，只有编号。 */
  title?: string;
  description: string;
  ready: boolean;
  /** Optional image path relative to public/, e.g. covers/hw01.webp. */
  cover?: string;
  coverAlt?: string;
}

export const homework: Homework[] = Array.from({ length: 9 }, (_, i) => ({
  id: `hw${String(i + 1).padStart(2, '0')}`,
  number: i + 1,
  title: i === 0 ? '网页空间布局' : undefined,
  description: i === 0 ? '从盒模型到 Grid 与 Flex，构建清晰、自适应的网页空间。' : '本次作业内容尚未添加。',
  ready: i === 0,
}));

/** 展示用名称：作业尚未添加时没有章节名，退回“作业 02”这样的编号形式。 */
export const displayName = (hw: Homework) => hw.title ?? `作业 ${String(hw.number).padStart(2, '0')}`;

export const href = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
