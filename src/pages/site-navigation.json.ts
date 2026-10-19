import { homework } from '../config/homework';
import { translate } from '../i18n';

export function GET() {
  return new Response(JSON.stringify(homework.map(({ id, title }) => ({
    id,
    title,
    titleEn: title ? translate('en', title) : undefined,
  }))), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
