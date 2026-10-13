const fail=k=>{throw Error(k);},key=JSON.stringify;
const unique=values=>[...new Map(values.map(v=>[key(v),v])).values()];
const axis=state=>state.columnIndex??{names:[null],values:state.columns.map(c=>[c])};
const compare=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]===b[i])continue;if(a[i]==null)return -1;if(b[i]==null)return 1;let x=a[i],y=b[i];if(typeof x==='boolean')x=+x;if(typeof y==='boolean')y=+y;if(typeof x==='number'&&typeof y==='number')return x-y;if(typeof x==='number'||typeof y==='number')return typeof x==='number'?-1:1;const xx=Array.from(String(x)),yy=Array.from(String(y));for(let j=0;j<Math.min(xx.length,yy.length);j++){const n=xx[j].codePointAt(0)-yy[j].codePointAt(0);if(n)return n;}return xx.length-yy.length;}return 0;};
function guard(rows,cols,levels){if(rows>100000||cols>200||rows*cols>2000000||rows*levels>2000000||levels>200)fail('tooManyRows');}
function selectedLevels(names,values){const result=values===undefined||Array.isArray(values)&&!values.length?[names.length-1]:values;if(!Array.isArray(result))fail('invalidIndexLevels');const output=result.map(v=>{if(typeof v==='string'&&!/^[-+]?\d+$/.test(v)){const hits=names.flatMap((n,i)=>n===v?[i]:[]);if(hits.length!==1)fail('invalidIndexLevels');return hits[0];}let n=Number(v);if(n<0)n+=names.length;if(!Number.isInteger(n)||n<0||n>=names.length)fail('invalidIndexLevels');return n;});if(new Set(output).size!==output.length)fail('invalidIndexLevels');return output;}
function finish(state,rows,columns,index,columnIndex,tool,selected=[]){guard(rows.length,columns.length,index.names.length);return {rows,columns,index,columnIndex,analysis:{kind:'axisReshape',tool,sourceRows:state.rows.length,sourceColumns:state.columns.length,beforeIndex:state.index?.names??[null],beforeColumns:axis(state).names,afterIndex:index.names,afterColumns:columnIndex?.names??[null],selected,cells:rows.length*columns.length,missing:rows.reduce((n,r)=>n+columns.filter(c=>r[c]==null).length,0)}};}
export const axisReshapeTypes=['columnIndex','stack','unstack'];
export function axisReshapeOperation(state,op){
 const {rows,columns}=state,p=op.params??{},index=state.index??{names:[null],values:rows.map((_,i)=>[i]),explicit:false},col=axis(state);
 if(op.type==='columnIndex'){
  if((p.method??'split')==='flatten'){
   const names=col.values.map(tuple=>tuple.map(v=>v??'').join(String(p.separator??' / ')));if(names.some(n=>!n)||new Set(names).size!==names.length)fail('duplicateColumns');
   return finish(state,rows.map(r=>Object.fromEntries(names.map((n,i)=>[n,r[columns[i]]]))),names,index,null,op.type);
  }
  if(p.method!==undefined&&p.method!=='split')fail('invalidOperation');const separator=String(p.separator??'_');if(!separator)fail('invalidColumnIndex');const values=columns.map(c=>c.split(separator)),depth=values[0]?.length??0;
  if(depth<2||depth>8||values.some(v=>v.length!==depth)||new Set(values.map(key)).size!==values.length)fail('invalidColumnIndex');
  let names=typeof p.names==='string'&&p.names.trim()?p.names.split(/\r?\n/).map(v=>v.trim()||null):Array(depth).fill(null);if(names.length!==depth)fail('invalidIndexNames');
  return finish(state,rows,[...columns],index,{names,values},op.type);
 }
 if(op.type==='stack'){
  const requested=selectedLevels(col.names,p.levels),sorted=[...requested].sort((a,b)=>a-b),selected=requested.length>1?requested.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v).map(({i})=>sorted[i]):requested,remaining=col.names.map((_,i)=>i).filter(i=>!selected.includes(i));if(new Set(col.values.map(key)).size!==col.values.length)fail('duplicateColumns');
  const groups=unique(col.values.map(v=>selected.map(i=>v[i]))),rest=remaining.length?unique(col.values.map(v=>remaining.map(i=>v[i]))):[[]],names=remaining.length?rest.map(v=>remaining.length===1?String(v[0]??'∅'):key(v)):[String(p.name??'value')];if(new Set(names).size!==names.length||names.some(v=>!v.trim()))fail('duplicateColumns');
  const map=new Map(col.values.map((v,i)=>[key([selected.map(l=>v[l]),remaining.map(l=>v[l])]),columns[i]])),output=[],labels=[];
  // pandas 2.2 stack_v3 applies argsort(level) to the original-order axis; reproduce its 3+ level permutation.
  // future_stack visits only combinations present in the column axis, including existing missing cells.
  for(let i=0;i<rows.length;i++)for(const g of groups){const values=rest.map(r=>{const field=map.get(key([g,r]));return field===undefined?null:rows[i][field]??null;});if(p.dropMissing==='include'&&values.every(v=>v==null))continue;guard(output.length+1,names.length,index.names.length+selected.length);output.push(Object.fromEntries(names.map((n,j)=>[n,values[j]])));labels.push([...index.values[i],...g]);}
  if(p.sort==='include'){const order=labels.map((_,i)=>i).sort((a,b)=>compare(labels[a],labels[b])||a-b),sortedRows=order.map(i=>output[i]),sortedLabels=order.map(i=>labels[i]);for(let i=0;i<order.length;i++){output[i]=sortedRows[i];labels[i]=sortedLabels[i];}}
  return finish(state,output,names,{names:[...index.names,...selected.map(i=>col.names[i])],values:labels,explicit:true},remaining.length>1?{names:remaining.map(i=>col.names[i]),values:rest}:remaining.length===1?{names:[col.names[remaining[0]]],values:rest}:null,op.type,selected);
 }
 if(op.type==='unstack'){
  const selected=selectedLevels(index.names,p.levels),remaining=index.names.map((_,i)=>i).filter(i=>!selected.includes(i));if(new Set(index.values.map(key)).size!==rows.length)fail('duplicateIndex');
  if(!remaining.length){const output=[],values=[],name=String(p.name??'value');if(!name.trim())fail('duplicateColumns');guard(rows.length*columns.length,1,col.names.length+selected.length);columns.forEach((c,j)=>rows.forEach((row,i)=>{output.push({[name]:row[c]??null});values.push([...col.values[j],...selected.map(l=>index.values[i][l])]);}));return finish(state,output,[name],{names:[...col.names,...selected.map(i=>index.names[i])],values,explicit:true},null,op.type,selected);}
  const rest=unique(index.values.map(v=>remaining.map(i=>v[i]))).sort(compare),groups=unique(index.values.map(v=>selected.map(i=>v[i])));if(selected.length===1)groups.sort(compare);
  const columnValues=col.values.flatMap(v=>groups.map(g=>[...v,...g])),names=columnValues.map(key),map=new Map(index.values.map((v,i)=>[key([remaining.map(l=>v[l]),selected.map(l=>v[l])]),i]));guard(rest.length,names.length,remaining.length);
  const fill=p.fill==='include'?Number(p.fillValue??0):null;if(p.fill==='include'&&!Number.isFinite(fill))fail('invalidNumber');
  const output=rest.map(r=>Object.fromEntries(columns.flatMap((c,j)=>groups.map((g,k)=>{const pos=map.get(key([r,g]));return [names[j*groups.length+k],pos===undefined?fill:rows[pos][c]??null];}))));
  return finish(state,output,names,{names:remaining.map(i=>index.names[i]),values:rest,explicit:true},{names:[...col.names,...selected.map(i=>index.names[i])],values:columnValues},op.type,selected);
 }
 fail('invalidOperation');
}
// Keep column labels tied to physical fields across row operations and field projections.
export function carryColumnIndex(state,result,op){
 if(Object.hasOwn(result,'columnIndex')||!state.columnIndex)return result;
 const compatible=new Set(['explode','setIndex','resetIndex','sortIndex','renameIndex','indexLoc','reindex','indexAssign','indexLevels','filter','filterTree','sort','rowSelect','topN','sample','sampling','dedup','dropMissing','iqr','groupFilter','columnRename','rename','columns','convert','text','replace','rank','fill','calculate','numeric','formula','binning','strings','weightedWindow','windows','ewm','dateparse','dateparts','datediff','selectTypes','groupRank']);
 if(!compatible.has(op.type)&&!(['groupMulti','groupNamed'].includes(op.type)&&op.params.mode==='transform'))return result;
 const old=state.columnIndex,values=result.columns.map(c=>{const original=op.type==='columnRename'?Object.entries(result.analysis.mapping).find(([,value])=>value===c)?.[0]??c:c,pos=state.columns.indexOf(original);return pos>=0?(op.type==='columnRename'?[c]:[...old.values[pos]]):[c,...old.names.slice(1).map(()=>'')];});return {...result,columnIndex:{names:[...old.names],values}};
}
