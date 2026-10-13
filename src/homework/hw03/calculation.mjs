// A bounded expression tree: never evaluate user JavaScript or Python.
const fail=k=>{throw new Error(k);},missing=v=>v==null||v==='',finite=v=>typeof v==='number'&&Number.isFinite(v),clean=v=>typeof v==='number'&&!Number.isFinite(v)?null:v===0?0:v;
export const binaryMethods=['add','sub','mul','div','floordiv','mod','pow','minimum','maximum','fillna','eq','ne','gt','gte','lt','lte','and','or'];
export const unaryMethods=['abs','negative','sqrt','log','log10','exp','floor','ceil','isna','notna','not'];
const number=v=>{if(!finite(v))fail('invalidNumber');return v;};
export function roundEven(value,decimals=0){
  if(!Number.isInteger(decimals)||Math.abs(decimals)>15)fail('invalidNumber');
  const factor=10**Math.abs(decimals),scaled=decimals<0?value/factor:value*factor;if(!Number.isFinite(scaled))return null;
  const floor=Math.floor(scaled),part=scaled-floor,r=part<.5?floor:part>.5?floor+1:floor%2===0?floor:floor+1;return clean(decimals<0?r*factor:r/factor);
}
function floorDivide(a,b){if(!b)return null;let mod=a%b,div=(a-mod)/b;if(mod&&(mod<0)!==(b<0))div-=1;if(!Number.isFinite(div))return null;const floor=Math.floor(div);return div-floor>.5?floor+1:floor;}
export function binaryValue(method,a,b){
  if(method==='fillna')return missing(a)?b:a;
  if(['and','or'].includes(method)){
    if(!missing(a)&&typeof a!=='boolean'||!missing(b)&&typeof b!=='boolean')fail('invalidFormula');
    if(method==='and')return a===false||b===false?false:missing(a)||missing(b)?null:true;
    return a===true||b===true?true:missing(a)||missing(b)?null:false;
  }
  if(['eq','ne','gt','gte','lt','lte'].includes(method)){
    if(missing(a)||missing(b))return method==='ne';
    const equal=a===b||(typeof a==='boolean'||typeof b==='boolean')&&Number(a)===Number(b);
    if(method==='eq')return equal;if(method==='ne')return !equal;
    if(!(finite(a)&&finite(b)||typeof a==='string'&&typeof b==='string'))fail('invalidFormula');
    return method==='gt'?a>b:method==='gte'?a>=b:method==='lt'?a<b:a<=b;
  }
  if(method==='pow'&&(a===1||b===0))return 1;
  if(missing(a)||missing(b))return null;number(a);number(b);
  switch(method){case 'add':return clean(a+b);case 'sub':return clean(a-b);case 'mul':return clean(a*b);case 'div':return clean(a/b);case 'floordiv':return floorDivide(a,b);case 'mod':{if(!b)return null;const r=a%b;return r===0?0:(r<0)!==(b<0)?r+b:r;}case 'pow':return clean(a**b);case 'minimum':return Math.min(a,b);case 'maximum':return Math.max(a,b);default:fail('invalidFormula');}
}
function unaryValue(method,v){
  if(method==='isna')return missing(v);if(method==='notna')return !missing(v);if(missing(v))return null;
  if(method==='not'){if(typeof v!=='boolean')fail('invalidFormula');return !v;}number(v);
  return clean(({abs:Math.abs,negative:x=>-x,sqrt:Math.sqrt,log:Math.log,log10:Math.log10,exp:Math.exp,floor:Math.floor,ceil:Math.ceil})[method](v));
}
export function compileExpression(node,columns,depth=0,budget={count:0,fields:new Set()}){
  if(!node||typeof node!=='object'||depth>8||++budget.count>200)fail('invalidFormula');
  const child=n=>compileExpression(n,columns,depth+1,budget);
  if(node.kind==='column'){if(!columns.includes(node.column))fail('missingColumn');budget.fields.add(node.column);return row=>missing(row[node.column])?null:row[node.column];}
  if(node.kind==='number'){if(node.value==null||String(node.value).trim()===''||!Number.isFinite(Number(node.value)))fail('invalidNumber');return ()=>Number(node.value);}
  if(node.kind==='text'){if(typeof node.value!=='string'||node.value.length>10000)fail('invalidFormula');return ()=>node.value;}
  if(node.kind==='missing')return ()=>null;
  if(node.kind==='boolean'){if(![true,false,'true','false'].includes(node.value))fail('invalidFormula');return ()=>node.value===true||node.value==='true';}
  if(node.kind==='binary'){if(!binaryMethods.includes(node.method))fail('invalidFormula');const a=child(node.left),b=child(node.right);return row=>binaryValue(node.method,a(row),b(row));}
  if(node.kind==='unary'){if(!unaryMethods.includes(node.method))fail('invalidFormula');const a=child(node.value);return row=>unaryValue(node.method,a(row));}
  if(node.kind==='round'){const d=Number(node.decimals??0);if(!Number.isInteger(d)||Math.abs(d)>15)fail('invalidNumber');const a=child(node.value);return row=>{const v=a(row);return missing(v)?null:roundEven(number(v),d);};}
  if(node.kind==='clip'){const a=child(node.value),lo=child(node.lower),hi=child(node.upper),scalar=['number','missing'].includes(node.lower.kind)&&['number','missing'].includes(node.upper.kind);return row=>{const v=a(row);let l=lo(row),h=hi(row);if(missing(v))return null;number(v);if(!missing(l))number(l);if(!missing(h))number(h);if(scalar&&!missing(l)&&!missing(h)&&l>h)[l,h]=[h,l];const clipped=!missing(l)&&v<l?l:v;return !missing(h)&&(node.upper.kind==='number'?clipped:v)>h?h:clipped;};}
  if(node.kind==='choose'){if(!['where','mask'].includes(node.method))fail('invalidFormula');const condition=child(node.condition),yes=child(node.yes),no=child(node.no);return row=>{const c=condition(row);if(!missing(c)&&typeof c!=='boolean')fail('invalidFormula');return (node.method==='where'?c===true:c===false)?yes(row):no(row);};}
  fail('invalidFormula');
}
export function calculationOperation(rows,columns,op){
  const p=op.params;let names,trees,sources;
  if(op.type==='formula'){
    if(typeof p.name!=='string'||!p.name.trim())fail('duplicateColumns');names=[p.name];trees=[p.tree];sources=[];
  }else{
    if(!Array.isArray(p.columns)||!p.columns.length||new Set(p.columns).size!==p.columns.length||p.columns.some(c=>!columns.includes(c)))fail('missingColumn');
    const method=p.method??'add',constant={kind:'number',value:p.constant??1};sources=p.columns;names=sources.map(c=>p.output==='overwrite'?c:String(p.prefix??'result_')+c+'_'+method);
    trees=sources.map(column=>{const value={kind:'column',column};if(['round','clip'].includes(method))return method==='round'?{kind:'round',value,decimals:p.decimals??0}:{kind:'clip',value,lower:p.lower==null||p.lower===''?{kind:'missing'}:{kind:'number',value:p.lower},upper:p.upper==null||p.upper===''?{kind:'missing'}:{kind:'number',value:p.upper}};
      if(unaryMethods.includes(method))return {kind:'unary',method,value};
      if(!['add','sub','mul','div','floordiv','mod','pow','minimum','maximum'].includes(method))fail('invalidFormula');return {kind:'binary',method,left:p.direction==='reverse'?constant:value,right:p.direction==='reverse'?value:constant};});
  }
  if(!['append','overwrite'].includes(p.output??'append'))fail('invalidOperation');
  if(names.some(k=>!k.trim()||p.output!=='overwrite'&&columns.includes(k))||new Set(names).size!==names.length)fail('duplicateColumns');
  const outputColumns=[...columns,...names.filter(k=>!columns.includes(k))];if(outputColumns.length>200||rows.length*outputColumns.length>2000000)fail('tooManyRows');
  const budget={count:0,fields:new Set()},compiled=trees.map(tree=>compileExpression(tree,columns,0,{count:0,fields:budget.fields}));
  if(!sources.length)sources=[...budget.fields];let characters=0;const values=rows.map(row=>compiled.map(fn=>{const v=clean(fn(row));if(typeof v==='string'&&(characters+=v.length)>20*1048576)fail('stringOutputLimit');return v;}));
  const output=rows.map((row,i)=>Object.fromEntries([...columns.filter(c=>!names.includes(c)).map(c=>[c,row[c]]),...names.map((c,j)=>[c,values[i][j]])]));
  const distribution={negative:0,zero:0,positive:0,missing:0,other:0};for(const vs of values)for(const v of vs){if(missing(v))distribution.missing++;else if(finite(v))distribution[v<0?'negative':v===0?'zero':'positive']++;else distribution.other++;}
  const samples=rows.slice(0,20).map((row,i)=>({before:sources.map(name=>({name,value:row[name]})),after:names.map((name,j)=>({name,value:values[i][j]}))}));
  let branch=null;if(trees[0]?.kind==='choose'){const condition=compileExpression(trees[0].condition,columns);branch={kept:0,replaced:0,unknown:0};for(const row of rows){const c=condition(row);if(missing(c))branch.unknown++;if(trees[0].method==='where'?c===true:c===false)branch.kept++;else branch.replaced++;}}
  return {columns:outputColumns,rows:output,analysis:{kind:'calculation',trees,names,sources,distribution,samples,branch,total:rows.length}};
}
