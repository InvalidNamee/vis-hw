// Pure, replayable operations. Never mutate source records.
export const extendedTypes = ['rename','columns','convert','text','replace','rank','sample'];
const missing = v => v == null || v === '';
const fail = key => { throw new Error(key); };
export function extendedOperation(rows, columns, op) {
  const p=op.params, c=p.column;
  if(op.type!=='sample' && op.type!=='columns' && !columns.includes(c))fail('missingColumn');
  const newName = () => { if(typeof p.name!=='string'||!p.name.trim()||columns.includes(p.name))fail('duplicateColumns');return p.name; };
  if(op.type==='rename') {
    const name=newName(); return {columns:columns.map(k=>k===c?name:k),rows:rows.map(r=>Object.fromEntries(columns.map(k=>[k===c?name:k,r[k]])))};
  }
  if(op.type==='columns') {
    if(!Array.isArray(p.columns)||!p.columns.length||new Set(p.columns).size!==p.columns.length||p.columns.some(k=>!columns.includes(k)))fail('missingColumn');
    if(!['keep','drop','first'].includes(p.mode))fail('invalidOperation');
    const names=p.mode==='keep'?p.columns:p.mode==='drop'?columns.filter(k=>!p.columns.includes(k)):[...p.columns,...columns.filter(k=>!p.columns.includes(k))];
    if(!names.length)fail('missingColumn');return {columns:names,rows:rows.map(r=>Object.fromEntries(names.map(k=>[k,r[k]])))};
  }
  if(op.type==='sample') {
    const n=Number(p.count);let seed=Number(p.seed);
    if(!Number.isInteger(n)||n<1||n>rows.length||!Number.isInteger(seed))fail('invalidNumber');
    seed >>>=0;const indices=rows.map((_,i)=>i);
    for(let i=indices.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=Math.floor(seed/4294967296*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
    return {columns,rows:indices.slice(0,n).map(i=>({...rows[i]}))};
  }
  let name=c, convert;
  if(op.type==='convert') {
    if(!['number','text','boolean','date'].includes(p.target)||!['raise','coerce'].includes(p.errors))fail('invalidOperation');
    convert=v=>{
      if(missing(v))return null;
      if(p.target==='text')return String(v);
      if(p.target==='number'){const text=String(v).trim(),n=typeof v==='boolean'?Number(v):Number(text);if((typeof v==='boolean'||/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(text))&&Number.isFinite(n))return n;}
      if(p.target==='boolean'){if(v===true||v===1||String(v).toLowerCase()==='true')return true;if(v===false||v===0||String(v).toLowerCase()==='false')return false;}
      if(p.target==='date'){const s=String(v);if(/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s.slice(0,10))return s;}
      if(p.errors==='coerce')return null;fail(p.target==='date'?'invalidDate':'invalidNumber');
    };
  } else if(op.type==='text') {
    if(!['strip','lower','upper','replace','slice','length'].includes(p.method))fail('invalidOperation');
    if(p.method==='length')name=newName();
    const start=Number(p.start??0),end=p.end===''||p.end==null?undefined:Number(p.end);
    if(p.method==='slice'&&(!Number.isInteger(start)||(end!==undefined&&!Number.isInteger(end))))fail('invalidNumber');
    convert=v=>missing(v)?null:p.method==='strip'?String(v).trim():p.method==='lower'?String(v).toLowerCase():p.method==='upper'?String(v).toUpperCase():p.method==='replace'?String(v).split(String(p.find)).join(String(p.replacement??'')):p.method==='slice'?Array.from(String(v)).slice(start,end).join(''):Array.from(String(v)).length;
  } else if(op.type==='replace') {
    let next=p.replacement;
    if(p.target==='missing')next=null;
    else if(p.target==='number'){next=Number(next);if(String(p.replacement).trim()===''||!Number.isFinite(next))fail('invalidNumber');}
    else if(p.target!=='text')fail('invalidOperation');
    convert=v=>!missing(v)&&String(v)===String(p.find)?next:v;
  } else if(op.type==='rank') {
    name=newName();if(!['average','min','max','dense','first'].includes(p.method))fail('invalidOperation');
    const values=rows.map((r,i)=>({v:r[c],i})).filter(r=>!missing(r.v));
    if(values.some(r=>typeof r.v!=='number'||!Number.isFinite(r.v)))fail('invalidNumber');
    values.sort((a,b)=>(a.v-b.v)*(p.desc?-1:1)||a.i-b.i);const ranks=new Map();let dense=0;
    for(let i=0;i<values.length;){let end=i+1;while(end<values.length&&values[end].v===values[i].v)end++;dense++;for(let j=i;j<end;j++)ranks.set(values[j].i,p.method==='dense'?dense:p.method==='min'?i+1:p.method==='max'?end:p.method==='first'?j+1:(i+1+end)/2);i=end;}
    return {columns:[...columns,name],rows:rows.map((r,i)=>({...r,[name]:ranks.get(i)??null}))};
  } else fail('invalidOperation');
  return {columns:name===c?columns:[...columns,name],rows:rows.map(r=>({...r,[name]:convert(r[c])}))};
}
