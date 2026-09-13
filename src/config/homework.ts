import hw01 from '../homework/hw01/meta';
import type { HomeworkMeta } from '../homework/types';

export interface Homework extends Omit<HomeworkMeta, 'title'> {
  id: string;
  number: number;
  title?: string;
}

const metadata: Partial<Record<string, HomeworkMeta>> = { hw01 };
export const homework: Homework[] = Array.from({ length: 9 }, (_, i) => {
  const id = `hw${String(i + 1).padStart(2, '0')}`;
  return {
    id,
    number: i + 1,
    ...(metadata[id] ?? { description: '本次作业内容尚未添加。', ready: false }),
  };
});

/** Use this in MDX, Astro, or other page shells; never import page content here. */
export function getHomework(id: string): Homework & HomeworkMeta {
  const entry = homework.find(hw => hw.id === id);
  if (!entry || !entry.title || !entry.description || !entry.ready) {
    throw new Error(`Homework ${id}: add complete, ready metadata in src/homework/${id}/meta.ts and register it in src/config/homework.ts.`);
  }
  return entry as Homework & HomeworkMeta;
}

export const displayName = (hw: Homework) => hw.title ?? `作业 ${String(hw.number).padStart(2, '0')}`;
export const href = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
