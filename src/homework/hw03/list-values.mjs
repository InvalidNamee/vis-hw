// Lists stay structured in raw JSON and backups. Limit nesting and expanded elements independently of table dimensions.
export function validateListValues(rows){
 let count=0;
 const visit=(value,depth)=>{if(Array.isArray(value)){if(depth>=8)throw Error('listDepth');count+=value.length;if(count>2000000)throw Error('tooManyRows');for(const item of value)visit(item,depth+1);}else if(value!==null&&typeof value==='object')throw Error('nestedJson');};
 for(const row of rows)for(const value of Object.values(row))visit(value,0);
}
export function displayValue(value,depth=0){
 if(value==null||value==='')return '∅';
 if(Array.isArray(value))return depth>=2?`[${value.length}]`:`[${value.slice(0,6).map(v=>displayValue(v,depth+1)).join(', ')}${value.length>6?`, … +${value.length-6}`:''}]`;
 return String(value);
}
export function explodeOperation(state,op){
 const {rows,columns}=state,p=op.params??{},selected=p.columns,index=state.index??{names:[null],values:rows.map((_,i)=>[i]),explicit:false};
 if(!Array.isArray(selected)||!selected.length||new Set(selected).size!==selected.length||selected.some(c=>!columns.includes(c)))throw Error('missingColumn');
 const counts=[],bands=[0,0,0,0,0,0];let total=0,empty=0,scalars=0;
 for(const row of rows){const sizes=selected.map(c=>Array.isArray(row[c])?Math.max(1,row[c].length):1);if(sizes.some(n=>n!==sizes[0]))throw Error('explodeLengths');const size=sizes[0];total+=size;if(total>100000||total*columns.length>2000000||total*(p.ignoreIndex==='include'?1:index.names.length)>2000000)throw Error('tooManyRows');counts.push(size);const n=Array.isArray(row[selected[0]])?row[selected[0]].length:1;bands[n===0?0:n===1?1:n<=5?2:n<=10?3:n<=100?4:5]++;empty+=selected.filter(c=>Array.isArray(row[c])&&!row[c].length).length;scalars+=selected.filter(c=>!Array.isArray(row[c])).length;}
 const output=[],values=[],mapping=[];let offset=0;
 rows.forEach((row,i)=>{if(mapping.length<30)mapping.push({source:i,start:offset,count:counts[i]});for(let j=0;j<counts[i];j++){output.push(Object.fromEntries(columns.map(c=>[c,selected.includes(c)&&Array.isArray(row[c])?(row[c][j]??null):row[c]])));values.push(p.ignoreIndex==='include'?[offset]:[...index.values[i]]);offset++;}});
 return {rows:output,columns:[...columns],index:p.ignoreIndex==='include'?{names:[null],values,explicit:false,booleanNumeric:[false]}:{...index,values},analysis:{kind:'explode',sourceRows:rows.length,outputRows:output.length,selected,empty,scalars,bands,mapping}};
}
