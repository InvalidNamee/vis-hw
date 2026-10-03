import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export function csvFor(dataset){
 const headers=['id','label_zh','label_en','value','unit','period','precision','kind','evidence_type','scope_zh','scope_en','source','source_url','published_at','verified_at','confidence_interval','standard_error','denominator_zh','denominator_en','limitation_zh','limitation_en'];
 const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
 const rows=dataset.records.map(r=>{
  const source=dataset.sources.find(s=>s.id===r.source);
  if(!source)throw new Error(`Unknown source: ${r.source}`);
  return [r.id,r.label.zh,r.label.en,r.value,r.unit,r.period,r.precision,r.kind,r.evidenceType,r.scope.zh,r.scope.en,r.source,source.url,source.publishedAt,source.verifiedAt,r.confidenceInterval?.join('–'),r.standardError,r.denominator?.zh,r.denominator?.en,r.limitation?.zh,r.limitation?.en];
 });
 return [headers,...rows].map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n';
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const root=new URL('../public/data/hw02/',import.meta.url);
 const dataset=JSON.parse(readFileSync(new URL('dataset.json',root),'utf8'));
 writeFileSync(new URL('indicators.csv',root),csvFor(dataset));
 console.log(`HW02: ${dataset.records.length} records exported.`);
}
