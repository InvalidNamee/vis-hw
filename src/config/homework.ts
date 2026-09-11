export const homework = Array.from({ length: 10 }, (_, i) => ({
  id: `hw${i + 1}`,
  number: i + 1,
  title: i === 0 ? '网页空间布局' : `作业 ${String(i + 1).padStart(2, '0')}`,
  description: i === 0 ? '从盒模型到 Grid 与 Flex，构建清晰、自适应的网页空间。' : '本章内容将在后续作业中更新。',
  ready: i === 0,
}));

export const href = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
