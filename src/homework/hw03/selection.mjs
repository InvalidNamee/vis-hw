export const selectionTypes=['filterTree','rowSelect','topN','sort'];
const missing=value=>value==null||value==='';
const numeric=value=>typeof value==='number'&&Number.isFinite(value);
const fail=key=>{throw new Error(key);};
export const filterOperators=['eq','ne','contains','starts','ends','isin','notin','gt','gte','lt','lte','range','dateRange','missing','present'];
export const valuesList=value=>Array.isArray(value)?value:typeof value==='string'?value.split(/\r?\n/).filter(v=>v!==''):[];
function comparable(a,b){
  if((numeric(a)||typeof a==='boolean')&&(numeric(b)||typeof b==='boolean'))return Number(a)-Number(b);
  const x=Array.from(String(a)),y=Array.from(String(b));
  for(let i=0;i<Math.min(x.length,y.length);i++){const d=x[i].codePointAt(0)-y[i].codePointAt(0);if(d)return d;}
  return x.length-y.length;
}
const same=(a,b)=>missing(a)&&missing(b)||!missing(a)&&!missing(b)&&String(a)===String(b);
export function compileCondition(condition,columns,depth=0,budget={count:0}) {
  if(!condition||typeof condition!=='object'||condition.negate!==undefined&&typeof condition.negate!=='boolean'||depth>8||++budget.count>200)fail('invalidCondition');
  let predicate;
  if(Array.isArray(condition.children)){
    if(!['and','or'].includes(condition.mode)||!condition.children.length)fail('invalidCondition');
    const children=condition.children.map(child=>compileCondition(child,columns,depth+1,budget));
    predicate=row=>condition.mode==='and'?children.every(test=>test(row)):children.some(test=>test(row));
  }else{
    const f=condition;if(!columns.includes(f.column))fail('missingColumn');if(!filterOperators.includes(f.operator))fail('invalidCondition');
    let lower,upper;
    if(['gt','gte','lt','lte','range'].includes(f.operator)){
      lower=Number(f.value);upper=Number(f.upper);
      if(f.value==null||String(f.value).trim()===''||!Number.isFinite(lower)||(f.operator==='range'&&(f.upper==null||String(f.upper).trim()===''||!Number.isFinite(upper)||upper<lower)))fail('invalidNumber');
    }
    if(f.operator==='dateRange'){
      lower=Date.parse(String(f.value));upper=Date.parse(String(f.upper));if(!Number.isFinite(lower)||!Number.isFinite(upper)||upper<lower)fail('invalidDate');
      // A date-only inclusive upper bound includes its full calendar day.
      if(/^\d{4}-\d{2}-\d{2}$/.test(String(f.upper)))upper+=86400000-1;
    }
    const list=valuesList(f.values??f.value);
    if(['isin','notin'].includes(f.operator)&&!list.length)fail('invalidCondition');
    predicate=row=>{
      const value=row[f.column];
      if(f.operator==='missing')return missing(value);if(f.operator==='present')return !missing(value);
      if(f.operator==='isin')return list.some(v=>same(value,v));if(f.operator==='notin')return !list.some(v=>same(value,v));
      if(f.operator==='ne')return !same(value,f.value);
      if(missing(value))return false;
      if(f.operator==='eq')return same(value,f.value);
      if(f.operator==='contains')return String(value).toLowerCase().includes(String(f.value??'').toLowerCase());
      if(f.operator==='starts')return String(value).startsWith(String(f.value??''));
      if(f.operator==='ends')return String(value).endsWith(String(f.value??''));
      if(f.operator==='dateRange'){const date=Date.parse(String(value));return Number.isFinite(date)&&date>=lower&&date<=upper;}
      if(!numeric(value))return false;
      if(f.operator==='gt')return value>lower;if(f.operator==='gte')return value>=lower;if(f.operator==='lt')return value<lower;if(f.operator==='lte')return value<=lower;
      return value>=lower&&value<=upper;
    };
  }
  return condition.negate?row=>!predicate(row):predicate;
}
export function matchesCondition(row,condition) {
  try{return compileCondition(condition,[condition.column])(row);}catch{return false;}
}
function checkedKeys(columns,params){
  const keys=Array.isArray(params.keys)?params.keys:[{column:params.column,desc:params.desc??false}];
  if(!keys.length||keys.length>columns.length||keys.some(key=>!key||typeof key!=='object')||new Set(keys.map(key=>key.column)).size!==keys.length)fail('invalidOperation');
  if(keys.some(key=>!key||!columns.includes(key.column)||key.desc!==undefined&&typeof key.desc!=='boolean'))fail('missingColumn');return keys;
}
function rowComparator(keys,placement='last'){
  if(!['first','last'].includes(placement))fail('invalidOperation');
  return (a,b)=>{
    for(const key of keys){const x=a[key.column],y=b[key.column];if(missing(x)||missing(y)){if(missing(x)&&missing(y))continue;return (missing(x)?1:-1)*(placement==='first'?-1:1);}
      const delta=comparable(x,y);if(delta)return delta*(key.desc?-1:1);}
    return 0;
  };
}
function slicePositions(length,start,end,step){
  const stride=step===''||step==null?1:Number(step);if(!Number.isInteger(stride)||stride===0)fail('invalidPositions');
  const normalize=(value,fallback)=>{if(value===''||value==null)return fallback;let n=Number(value);if(!Number.isInteger(n))fail('invalidPositions');if(n<0)n+=length;return stride>0?Math.max(0,Math.min(length,n)):Math.max(-1,Math.min(length-1,n));};
  const from=normalize(start,stride>0?0:length-1),to=normalize(end,stride>0?length:-1),positions=[];
  for(let i=from;stride>0?i<to:i>to;i+=stride)positions.push(i);return positions;
}
export function selectionOperation(rows,columns,op){
  const p=op.params;
  if(op.type==='filterTree'){const test=compileCondition(p.tree,columns);return {columns,rows:rows.filter(test)};}
  if(op.type==='sort')return {columns,rows:[...rows].sort(rowComparator(checkedKeys(columns,p),p.missing??'last'))};
  if(op.type==='topN'){
    if(!Array.isArray(p.columns)||!p.columns.length||new Set(p.columns).size!==p.columns.length||p.columns.some(c=>!columns.includes(c)))fail('missingColumn');
    if(rows.some(row=>p.columns.some(c=>!missing(row[c])&&!numeric(row[c])&&typeof row[c]!=='boolean')))fail('invalidNumber');
    const count=Number(p.count);if(!Number.isInteger(count)||count<0||!['ascending','descending'].includes(p.direction)||!['first','last','all'].includes(p.keep??'first'))fail('invalidOperation');
    const desc=p.direction==='descending',keys=p.columns.map(column=>({column,desc}));
    const selectOne=(input,column,n,keep)=>{
      if(n<=0)return [];
      const compare=rowComparator([{column,desc}]);
      if(n>=input.length)return [...input].sort((a,b)=>compare(a.row,b.row)).slice(0,n);
      const valid=input.filter(item=>!missing(item.row[column])),nulls=input.filter(item=>missing(item.row[column]));
      const sorted=[...valid].sort((a,b)=>compare(a.row,b.row)||(keep==='last'?b.index-a.index:a.index-b.index));
      let take=Math.min(n,sorted.length);
      if(keep==='all'&&take>0)while(take<sorted.length&&compare(sorted[take-1].row,sorted[take].row)===0)take++;
      const selected=sorted.slice(0,take),end=keep==='all'?(take<n&&n<=take+nulls.length?take+nulls.length:take):n;
      return [...selected,...nulls].slice(0,end);
    };
    // pandas resolves only the unsafe boundary group with the next metric.
    // This also preserves its documented keep='last' and missing-value behavior.
    let remaining=rows.map((row,index)=>({row,index})),needed=count,chosen=[];
    for(let i=0;i<p.columns.length;i++){
      const column=p.columns[i],last=i===p.columns.length-1,values=selectOne(remaining,column,needed,last?p.keep??'first':'all');
      const append=items=>{chosen=desc?[...items,...chosen]:[...chosen,...items];};
      if(last||values.length<=needed){append(values);break;}
      const boundary=values.at(-1).row[column],unsafe=values.filter(item=>!missing(boundary)&&same(item.row[column],boundary)),safe=values.filter(item=>missing(boundary)||!same(item.row[column],boundary));
      append(safe);remaining=unsafe;needed=count-chosen.length;
    }
    if(p.columns.length>1)chosen.sort((a,b)=>rowComparator(keys)(a.row,b.row));
    return {columns,rows:chosen.map(item=>item.row)};
  }
  if(op.type==='rowSelect'){
    if(p.mode==='slice')return {columns,rows:slicePositions(rows.length,p.start,p.end,p.step).map(index=>rows[index])};
    if(p.mode==='positions'){
      const values=Array.isArray(p.positions)?p.positions:typeof p.positions==='string'?p.positions.split(/[\s,]+/).filter(Boolean):[];
      if(!values.length)fail('invalidPositions');const indices=values.map(Number);if(indices.some(index=>!Number.isInteger(index)||index>=rows.length||index<-rows.length))fail('invalidPositions');
      return {columns,rows:indices.map(index=>rows[index<0?index+rows.length:index])};
    }
    if(p.mode==='labels'){
      if(!columns.includes(p.column))fail('missingColumn');const labels=valuesList(p.values);if(!labels.length)fail('invalidCondition');const index=new Map();
      for(const row of rows){const key=missing(row[p.column])?'null':JSON.stringify(String(row[p.column]));if(!index.has(key))index.set(key,[]);index.get(key).push(row);}
      const output=[];for(const value of labels){const matched=index.get(missing(value)?'null':JSON.stringify(String(value)));if(!matched)fail('missingRowLabel');output.push(...matched);if(output.length>100000)fail('tooManyRows');}return {columns,rows:output};
    }
  }
  fail('invalidOperation');
}
