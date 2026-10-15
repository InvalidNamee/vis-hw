import {bin, extent, scaleLinear} from 'd3';

// Small integer domains represent counts by value, rather than fractional bins.
export function numericDistribution(values, reference = values) {
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const data = values.filter(finite), all = reference.filter(finite);
  if (!all.length) return {discrete:false, domain:[0,1], bars:[]};
  const unique = [...new Set(all)].sort((a,b)=>a-b);
  if (unique.length <= 16 && unique.every(Number.isSafeInteger)) {
    const counts = new Map();
    for (const value of data) counts.set(value,(counts.get(value)??0)+1);
    return {discrete:true, domain:[unique[0],unique.at(-1)], bars:unique.map(value=>({value,lower:value,upper:value,count:counts.get(value)??0}))};
  }
  let [lo,hi] = extent(all);
  if (lo === hi) { const padding = Math.max(.5,Math.abs(lo)*.05);lo-=padding;hi+=padding; }
  const scale = scaleLinear().domain([lo,hi]).nice(14), domain = scale.domain();
  // An explicit threshold at the upper endpoint creates a zero-width final bin.
  const thresholds = scale.ticks(14).filter(value=>value>domain[0]&&value<domain[1]);
  const bars = bin().domain(domain).thresholds(thresholds)(data).map(bucket=>({value:null,lower:bucket.x0,upper:bucket.x1,count:bucket.length}));
  return {discrete:false,domain,bars};
}
