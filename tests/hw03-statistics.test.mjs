import test from 'node:test';
import assert from 'node:assert/strict';
import {applyOperation, replay, validateBackup, profile, aggregate} from '../src/homework/hw03/model.mjs';
import {quantile, distribution, moments, pairSample} from '../src/homework/hw03/statistics.mjs';
const rows=[{label:'A',x:1,y:8,constant:2},{label:'A',x:2,y:null,constant:2},{label:'B',x:2,y:3,constant:2},{label:null,x:null,y:2,constant:2},{label:'C',x:10,y:1,constant:2}];
const columns=['label','x','y','constant'];
const run=(type,params)=>applyOperation(rows,columns,{type,params});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('quantiles interpolate boundaries and round nearest halfway to even',()=>{
  const values=[0,10,20,30];
  assert.equal(quantile(values,.25),7.5);assert.equal(quantile(values,.5,'lower'),10);assert.equal(quantile(values,.5,'higher'),20);assert.equal(quantile(values,.25,'midpoint'),5);
  assert.equal(quantile(values,.5,'nearest'),20);assert.equal(quantile(values,.5/3,'nearest'),0);
  assert.equal(quantile([],0),null);assert.equal(quantile(values,1),30);assert.throws(()=>quantile(values,1.1),/invalidNumber/);
});
test('moments compute sample/population variance and resist large offsets',()=>{
  near(moments([1e12+1,1e12+2,1e12+3]).var,1);
  near(moments([1,2,3],0).var,2/3);assert.equal(moments([1],1).std,null);
  assert.equal(aggregate([1,2,3],'var'),1);
  const p=profile(rows,columns).find(p=>p.column==='x');assert.equal(p.count,4);assert.equal(p.q1,1.75);assert.equal(p.q3,4);
});
test('describe includes numeric moments, categorical top/frequency and valid counts',()=>{
  const data=run('describe',{columns:['x','label'],factor:1.5,ddof:1});
  const numeric=data.rows[0],categorical=data.rows[1];
  assert.equal(numeric.count,4);assert.equal(numeric.missing,1);assert.equal(numeric.median,2);assert.equal(numeric.q1,1.75);assert.equal(numeric.q3,4);
  assert.equal(categorical.top,'A');assert.equal(categorical.freq,2);assert.equal(categorical.mean,null);
  assert.equal(data.analysis.boxes[0].outliers,1);assert.equal(data.analysis.boxes[0].whiskerHigh,2);
});
test('frequencies normalize by included rows and handle colliding field names',()=>{
  const data=run('frequencies',{columns:['label'],missing:'exclude',direction:'descending'});
  assert.equal(data.rows[0].count,2);assert.equal(data.rows[0].proportion,.5);assert.equal(data.rows.at(-1).cumulative,1);
  assert.equal(run('frequencies',{columns:['label','x'],missing:'include'}).analysis.total,5);
  const other=applyOperation([{count:'a',proportion:'b'}],['count','proportion'],{type:'frequencies',params:{columns:['count','proportion']}});
  assert.deepEqual(other.columns,['count','proportion','count_','proportion_','cumulative']);
});
test('pairwise correlations exclude missing observations and return null for constants',()=>{
  const data=run('correlation',{columns:['x','y','constant'],method:'pearson',minPeriods:2});
  assert.equal(data.analysis.counts[0][1],3);near(data.analysis.matrix[0][0],1);assert.equal(data.analysis.matrix[0][2],null);assert.equal(data.analysis.matrix[2][2],null);
  assert.equal(run('correlation',{columns:['x','y'],method:'pearson',minPeriods:4}).analysis.matrix[0][1],null);
  assert.throws(()=>run('correlation',{columns:['label'],method:'pearson'}),/invalidNumber/);
});
test('Spearman reranks only pairwise complete observations and handles ties',()=>{
  const data=run('correlation',{columns:['x','y'],method:'spearman'});near(data.analysis.matrix[0][1],-1);
  const tied=applyOperation([{x:1,y:1},{x:1,y:3},{x:3,y:2}],['x','y'],{type:'correlation',params:{columns:['x','y'],method:'spearman'}});near(tied.analysis.matrix[0][1],0);
});
test('covariance uses pair-specific sample count and chosen ddof',()=>{
  const data=run('correlation',{columns:['x','y'],method:'covariance',ddof:1});
  const pairs=[[1,8],[2,3],[10,1]],mx=13/3,my=4;
  near(data.analysis.matrix[0][1],pairs.reduce((n,[x,y])=>n+(x-mx)*(y-my),0)/2);
  near(run('correlation',{columns:['x','y'],method:'covariance',ddof:0}).analysis.matrix[0][1],data.analysis.matrix[0][1]);
  const complete=[{x:1,y:8},{x:2,y:3},{x:10,y:1}];
  near(applyOperation(complete,['x','y'],{type:'correlation',params:{columns:['x','y'],method:'covariance',ddof:0}}).analysis.matrix[0][1],data.analysis.matrix[0][1]*2/3);
});
test('IQR flags, removes and clips without mutating missing values or source',()=>{
  const stats=distribution([1,2,2,10,null]);assert.equal(stats.lower,-1.625);assert.equal(stats.upper,7.375);
  assert.deepEqual(run('iqr',{column:'x',factor:1.5,mode:'mark',name:'flag'}).rows.map(r=>r.flag),[false,false,false,null,true]);
  assert.equal(run('iqr',{column:'x',mode:'remove'}).rows.length,4);
  assert.equal(run('iqr',{column:'x',mode:'clip'}).rows.at(-1).x,7.375);assert.equal(rows.at(-1).x,10);
  assert.throws(()=>run('iqr',{column:'x',mode:'mark',name:'x'}),/duplicateColumns/);
});
test('type selection supports exclusion, boolean/date types and no-match error',()=>{
  assert.deepEqual(run('selectTypes',{target:'number',mode:'include'}).columns,['x','y','constant']);
  assert.deepEqual(run('selectTypes',{target:'number',mode:'exclude'}).columns,['label']);
  assert.throws(()=>run('selectTypes',{target:'date',mode:'include'}),/noMatchingColumns/);
});
test('statistics replay retains source cursor and backup reconstructs analytics',()=>{
  const dataset={id:'stats',name:'stats.json',format:'json',raw:JSON.stringify(rows),rows,columns};
  const ops=[{type:'sort',params:{column:'x'}},{type:'correlation',params:{columns:['x','y'],method:'spearman'}}];
  const data=replay(dataset,ops,2,[dataset]);assert.equal(data.analysis.sourceCursor,1);
  const restored=validateBackup({version:1,datasets:[dataset],active:'stats',operations:ops,cursor:2});
  assert.deepEqual(replay(restored.datasets[0],ops,2,restored.datasets).analysis,data.analysis);
  const sample=pairSample(rows,'x','y',2);assert.equal(sample.count,3);assert.equal(sample.points.length,2);
});

test('profile count includes nonnumeric values and result dimensions stay within processing limits',()=>{
  assert.equal(profile(rows,columns).find(p=>p.column==='label').count,4);
  const names=Array.from({length:200},(_,i)=>`c${i}`),record=Object.fromEntries(names.map(k=>[k,'a']));
  assert.throws(()=>applyOperation([record],names,{type:'frequencies',params:{columns:names}}),/tooManyRows/);
});
