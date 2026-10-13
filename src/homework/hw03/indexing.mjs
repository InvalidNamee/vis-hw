import {groupingOperation} from './grouping.mjs';
import {dtypeTypes,dtypeOperation,carryTypes,categoricalSort,dtypeBase} from './dtypes.mjs';
import {typeOfColumn} from './statistics.mjs';
import {extractAllOperation} from './extract-all.mjs';
import {axisReshapeTypes,axisReshapeOperation,carryColumnIndex} from './axis-reshape.mjs';
import {explodeOperation} from './list-values.mjs';
import {alignmentTypes,alignmentOperation} from './index-alignment.mjs';
import {booleanNumericLevels} from './index-labels.mjs';
import {indexSelection} from './index-selection.mjs';
// Index metadata travels with replay results; persisted operations reconstruct it from the source.
export const indexTypes=['setIndex','resetIndex','sortIndex','renameIndex','indexLoc','reindex','indexAssign','indexLevels'];
const fail=k=>{throw new Error(k);},missing=v=>v==null||v==='';
export const rangeIndex=length=>({names:[null],values:Array.from({length},(_,i)=>[i]),explicit:false,booleanNumeric:[false]});
const tupleKey=tuple=>JSON.stringify(tuple.map(v=>missing(v)?null:typeof v==='boolean'?Number(v):v));
const cloneIndex=index=>({...index,names:[...index.names],values:index.values.map(v=>[...v])});
function finish(rows,columns,index){
 if(index.names.length>200||index.values.length*index.names.length>2000000||rows.length*columns.length>2000000||columns.length>200)fail('tooManyRows');
 const counts=new Map();for(const tuple of index.values){const key=tupleKey(tuple);counts.set(key,(counts.get(key)??0)+1);}const unique=counts.size,duplicateRows=[...counts.values()].reduce((n,c)=>n+(c>1?c:0),0);
 return {rows,columns,index,analysis:{kind:'index',levels:index.names.length,unique,duplicateRows,total:rows.length,names:index.names,samples:index.values.slice(0,20),levelUnique:index.names.map((_,i)=>new Set(index.values.map(t=>tupleKey([t[i]]))).size)}};
}
function levelsFor(index,selected,defaultAll=true){
 const levels=selected===undefined||Array.isArray(selected)&&!selected.length&&defaultAll?index.names.map((_,i)=>i):selected;
 if(!Array.isArray(levels))fail('invalidIndexLevels');const result=levels.map(value=>{if(typeof value==='number'&&Number.isInteger(value)){const level=value<0?index.names.length+value:value;if(level>=0&&level<index.names.length)return level;}else if(typeof value==='string'){const matches=index.names.flatMap((name,i)=>name===value?[i]:[]);if(matches.length===1)return matches[0];}fail('invalidIndexLevels');});
 if(new Set(result).size!==result.length)fail('invalidIndexLevels');return result;
}
export function indexOperation(state,op){
 const {rows,columns}=state,p=op.params??{},original=state.index??rangeIndex(rows.length);let index=cloneIndex(original);
 if(op.type==='indexAssign'){
  const selected=indexSelection({...state,index:original},{type:'indexLoc',params:{...p,fillValue:null}}),value=p.value??null;
  if(value!==null&&!['string','number','boolean'].includes(typeof value)||typeof value==='number'&&!Number.isFinite(value))fail('invalidIndexValue');
  const positions=new Set(selected.positions),changes=[];let changedRows=0,changedCells=0;
  const output=rows.map((row,i)=>{if(!positions.has(i))return {...row};let changed=false;const copy={...row};for(const c of selected.columns){if(!Object.is(row[c],value)){changed=true;changedCells++;if(changes.length<20)changes.push({index:original.values[i],column:c,before:row[c],after:value});}Object.defineProperty(copy,c,{value,enumerable:true,writable:true,configurable:true});}if(changed)changedRows++;return copy;});
  const result=finish(output,[...columns],cloneIndex(original));result.analysis.query={...selected.query,operation:'indexAssign',outputRows:rows.length,mapping:selected.query.mapping.map(m=>({...m,output:m.source})),assignment:{matchedRows:positions.size,changedRows,changedCells,changes}};return result;
 }
 if(['indexLoc','reindex'].includes(op.type)){const selected=indexSelection({...state,index:original},op),result=finish(selected.rows,selected.columns,selected.index);result.analysis.query=selected.query;return result;}
 if(op.type==='setIndex'){
  const selected=p.columns;if(!Array.isArray(selected)||!selected.length||new Set(selected).size!==selected.length||selected.some(c=>!columns.includes(c)))fail('missingColumn');
  if(rows.some(r=>selected.some(c=>Array.isArray(r[c]))))fail('invalidIndexValue');
  const append=p.append==='include',drop=p.drop!=='exclude';if(selected.length+(append?original.names.length:0)>200||(selected.length+(append?original.names.length:0))*rows.length>2000000)fail('tooManyRows');index={explicit:true,names:[...(append?original.names:[]),...selected],values:rows.map((r,i)=>[...(append?original.values[i]:[]),...selected.map(c=>missing(r[c])?null:r[c])])};
  index.booleanNumeric=[...(append?(original.booleanNumeric??booleanNumericLevels(original.values,original.names.length)):[]),...booleanNumericLevels(index.values,index.names.length).slice(append?original.names.length:0)];
  if(p.verify==='include'&&new Set(index.values.map(tupleKey)).size!==rows.length)fail('duplicateIndex');
  const names=drop?columns.filter(c=>!selected.includes(c)):[...columns];return finish(rows.map(r=>Object.fromEntries(names.map(c=>[c,r[c]]))),names,index);
 }
 if(op.type==='resetIndex'){
  const selected=levelsFor(original,p.levels),chosen=new Set(selected),remaining=original.names.map((_,i)=>i).filter(i=>!chosen.has(i)),rest=remaining.length?{...index,names:remaining.map(i=>index.names[i]),values:index.values.map(tuple=>remaining.map(i=>tuple[i])),booleanNumeric:remaining.map(i=>index.booleanNumeric?.[i]??false),explicit:true}:rangeIndex(rows.length);
  const drop=p.drop==='include';if(drop)return finish(rows.map(r=>({...r})),[...columns],rest);
  const ordered=[...selected].sort((a,b)=>a-b),names=ordered.map(i=>index.names[i]??(index.names.length===1?(columns.includes('index')?'level_0':'index'):`level_${i}`));
  if(new Set([...names,...columns]).size!==names.length+columns.length)fail('duplicateColumns');
  return finish(rows.map((r,i)=>Object.fromEntries([...names.map((name,j)=>[name,index.values[i][ordered[j]]]),...columns.map(c=>[c,r[c]])])),[...names,...columns],rest);
 }
 if(op.type==='indexLevels'){
  if(index.names.length<2)fail('invalidIndexLevels');const method=p.method??'swap';let order=index.names.map((_,i)=>i);
  if(method==='swap'){const a=levelsFor(index,[p.left??0])[0],b=levelsFor(index,[p.right??index.names.length-1])[0];[order[a],order[b]]=[order[b],order[a]];}
  else if(method==='reorder'){order=levelsFor(index,p.levels,false);if(order.length!==index.names.length)fail('invalidIndexLevels');}
  else if(method==='drop'){const dropped=new Set(levelsFor(index,p.levels??[index.names.length-1],false));if(!dropped.size)fail('invalidIndexLevels');if(dropped.size===index.names.length)fail('indexKeepLevel');order=order.filter(i=>!dropped.has(i));}
  else fail('invalidOperation');
  const beforeNames=[...index.names];index={...index,names:order.map(i=>index.names[i]),values:index.values.map(tuple=>order.map(i=>tuple[i])),booleanNumeric:order.map(i=>index.booleanNumeric?.[i]??false),explicit:true};const result=finish(rows,[...columns],index);result.analysis.levelTransition={before:beforeNames,after:index.names,order};return result;
 }
 if(op.type==='renameIndex'){
  const names=typeof p.names==='string'?p.names.split(/\r?\n/):p.names;if(!Array.isArray(names)||names.length!==index.names.length||names.some(n=>n!==null&&typeof n!=='string'))fail('invalidIndexNames');index.names=names.map(n=>n==null||!n.trim()?null:n.trim());index.explicit=true;return finish(rows,[...columns],index);
 }
 if(op.type==='sortIndex'){
  const desc=p.direction==='descending',last=p.missing!=='first',selected=levelsFor(index,p.levels),sortLevels=[...selected,...(p.sortRemaining==='exclude'?[]:index.names.map((_,i)=>i).filter(i=>!selected.includes(i)))];
  const compare=(a,b)=>{if(missing(a)||missing(b))return missing(a)===missing(b)?0:missing(a)?(last?1:-1):(last?-1:1);if(typeof a==='boolean')a=+a;if(typeof b==='boolean')b=+b;let n=0;if(typeof a==='number'&&typeof b==='number')n=a-b;else if(typeof a==='number'||typeof b==='number')n=typeof a==='number'?-1:1;else{const aa=Array.from(String(a)),bb=Array.from(String(b));for(let i=0;i<Math.min(aa.length,bb.length);i++){n=aa[i].codePointAt(0)-bb[i].codePointAt(0);if(n)break;}if(!n)n=aa.length-bb.length;}return desc?-n:n;};
  const positions=rows.map((_,i)=>i).sort((a,b)=>{for(const l of sortLevels){const n=compare(index.values[a][l],index.values[b][l]);if(n)return n;}return a-b;});index.values=positions.map(i=>index.values[i]);return finish(positions.map(i=>rows[i]),[...columns],index);
 }
 fail('invalidOperation');
}
// Positional symbols distinguish identical records with different index labels. Never serialize or persist these symbols.
const position=Symbol('sourceRowPosition');
const subsetTypes=new Set(['filter','filterTree','sort','rowSelect','topN','sample','sampling','dedup','dropMissing','iqr','groupFilter']);
const sameRows=new Set(['columnRename','rename','columns','convert','text','replace','rank','fill','calculate','numeric','formula','binning','strings','weightedWindow','windows','ewm','dateparse','dateparts','datediff','selectTypes','groupRank']);
export function applyIndexedOperation(state,op,execute,datasets=[]){return carryTypes(state,carryColumnIndex(state,executeIndexedOperation(state,op,execute,datasets),op),op);}
function executeIndexedOperation(state,op,execute,datasets=[]){
 if(['groupMulti','groupNamed'].includes(op.type)&&state.types){const params=op.type==='groupNamed'?{...op.params,columns:[...new Set((op.params.specs??[]).map(s=>s.column))],methods:[...new Set((op.params.specs??[]).map(s=>s.method))]}:op.params,result=groupingOperation(state.rows,state.columns,{...op,params},state.types);return {...result,index:params.mode==='transform'?state.index:rangeIndex(result.rows.length)};}
 if(op.type==='columnRename'&&state.columnIndex?.names.length>1)fail('renameFlattenFirst');
 if(dtypeTypes.includes(op.type))return dtypeOperation(state,op);
 const sorted=categoricalSort(state,op);if(sorted)return sorted;
 if(op.type==='selectTypes'&&(state.types||op.params.target==='category')){const names=state.columns.filter(c=>((dtypeBase(state.types?.[c])??typeOfColumn(state.rows,c))===op.params.target)===(op.params.mode==='include'));if(!names.length)fail('noMatchingColumns');return {rows:state.rows.map(r=>Object.fromEntries(names.map(c=>[c,r[c]]))),columns:names,index:state.index};}
 if(op.type==='extractAll')return extractAllOperation(state,op);
 if(axisReshapeTypes.includes(op.type))return axisReshapeOperation(state,op);
 if(op.type==='explode')return explodeOperation(state,op);
 if(alignmentTypes.includes(op.type))return alignmentOperation(state,op,datasets);
 if(indexTypes.includes(op.type))return indexOperation(state,op);
 const index=state.index??rangeIndex(state.rows.length);
 if(subsetTypes.has(op.type)){
  const input=state.rows.map((row,i)=>({...row,[position]:i})),result=execute(input,state.columns);
  // All subset operations preserve references or spread their input records; verify this contract before mapping.
  if(result.rows.every(row=>Number.isInteger(row[position]))){const positions=result.rows.map(row=>row[position]);for(const row of result.rows)delete row[position];return {...result,index:{...index,names:[...index.names],values:positions.map(i=>[...index.values[i]])}};}
  // Group filters may deliberately replace every cell with missing while retaining row positions.
  if((op.type==='groupFilter'&&op.params.mode==='missing'||op.type==='dropMissing'&&op.params.axis==='columns')&&result.rows.length===state.rows.length){for(const row of result.rows)delete row[position];return {...result,index:cloneIndex(index)};}
  fail('invalidOperation');
 }
 const result=execute(state.rows,state.columns),keep=sameRows.has(op.type)||(op.type==='groupMulti'||op.type==='groupNamed')&&op.params.mode==='transform';
 return {...result,index:keep&&result.rows.length===state.rows.length?cloneIndex(index):rangeIndex(result.rows.length)};
}
export function exportIndexed(rows,columns,index){
 if(!index?.explicit)return {rows,columns};
 const reserved=new Set(columns),names=index.names.map((name,i)=>{let base=name??(index.names.length===1?'index':`level_${i}`),next=base,n=1;while(reserved.has(next))next=base+'_'+n++;reserved.add(next);return next;});
 return {columns:[...names,...columns],rows:rows.map((row,i)=>Object.fromEntries([...names.map((name,j)=>[name,index.values[i][j]]),...columns.map(c=>[c,row[c]])]))};
}
