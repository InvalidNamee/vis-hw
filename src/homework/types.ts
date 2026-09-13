/** Framework-independent metadata shared by every homework page. */
export interface HomeworkMeta {
  title: string;
  description: string;
  ready: boolean;
  /** Image path relative to public/. */
  cover?: string;
  coverAlt?: string;
}
