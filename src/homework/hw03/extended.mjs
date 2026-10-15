// Pure, replayable operations. Never mutate source records.
export const extendedTypes = ['columns','convert','text','replace'];
const missing = v => v == null || v === '';
const fail = key => { throw new Error(key); };
export function extendedOperation(rows, columns, op) {
  const p=op.params, c=p.column;
  if(op.type!=='columns' && !columns.includes(c))fail('missingColumn');
  const newName = () => { if(typeof p.name!=='string'||!p.name.trim()||columns.includes(p.name))fail('duplicateColumns');return p.name; };
  if(op.type==='columns') {
    if(!Array.isArray(p.columns)||!p.columns.length||new Set(p.columns).size!==p.columns.length||p.columns.some(k=>!columns.includes(k)))fail('missingColumn');
    if(!['keep','drop','first'].includes(p.mode))fail('invalidOperation');
    const names=p.mode==='keep'?p.columns:p.mode==='drop'?columns.filter(k=>!p.columns.includes(k)):[...p.columns,...columns.filter(k=>!p.columns.includes(k))];
    if(!names.length)fail('missingColumn');return {columns:names,rows:rows.map(r=>Object.fromEntries(names.map(k=>[k,r[k]])))};
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
  } else fail('invalidOperation');
  return {columns:name===c?columns:[...columns,name],rows:rows.map(r=>({...r,[name]:convert(r[c])}))};
}
