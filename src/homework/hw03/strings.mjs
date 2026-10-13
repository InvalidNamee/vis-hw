// Flat-column string operations; source rows remain immutable.
const fail=k=>{throw new Error(k);};
const text=v=>v==null||v===''?null:typeof v==='string'?v:null;
export function regex(pattern,flags='') {
  try {return new RegExp(pattern.replace(/\(\?P<([A-Za-z_]\w*)>/g,'(?<$1>'),`gu${flags}`);}catch{fail('invalidRegex');}
}
export function captures(pattern){
  const names=[];let escaped=false,inClass=false;
  for(let i=0;i<pattern.length;i++){const c=pattern[i];if(escaped){escaped=false;continue;}if(c==='\\'){escaped=true;continue;}if(c==='[')inClass=true;if(c===']')inClass=false;if(c==='('&&!inClass){if(pattern[i+1]!=='?')names.push(String(names.length));else{const m=pattern.slice(i).match(/^\(\?(?:P)?<([A-Za-z_]\w*)>/);if(m)names.push(m[1]);}}}
  return names;
}
function split(s,p,n,mode,reverse){
  if(mode==='whitespace'){
    const matches=[];for(const m of s.matchAll(/\S+/gu)){matches.push(m);if((n<0||n>=200)&&matches.length>200)fail('tooManyRows');if(n>=0&&!reverse&&matches.length>n)break;if(n>=0&&reverse&&matches.length>n+1)matches.shift();}if(!matches.length)return [];
    if(n<0||matches.length<=n)return matches.map(m=>m[0]);
    return reverse?[s.slice(0,matches.at(-n).index).trimEnd(),...matches.slice(-n).map(m=>m[0])]:[...matches.slice(0,n).map(m=>m[0]),s.slice(matches[n].index)];
  }
  if(mode==='literal'){
    if(!p)fail('invalidRegex');const parts=[];let last=reverse?s.length:0,count=0;
    while(n<0||count<n){if(reverse&&last<p.length)break;const i=reverse?s.lastIndexOf(p,last-p.length):s.indexOf(p,last);if(i<0)break;if(reverse){parts.unshift(s.slice(i+p.length,last));last=i;}else{parts.push(s.slice(last,i));last=i+p.length;}count++;if(parts.length>200)fail('tooManyRows');if(reverse&&last===0)break;}
    if(reverse)parts.unshift(s.slice(0,last));else parts.push(s.slice(last));return parts;
  }
  const r=regex(p),out=[];let last=0,count=0;
  for(const m of s.matchAll(r)){if(n>=0&&count>=n)break;out.push(s.slice(last,m.index),...m.slice(1).map(v=>v??null));last=m.index+m[0].length;count++;if(out.length>200)fail('tooManyRows');}out.push(s.slice(last));return out;
}
function replacement(template,m){
  return template.replace(/\\(?:g<([^>]+)>|(\d+)|([\\nrt])|(.))/g,(_,group,num,escape,other)=>{
    if(escape)return ({'\\':'\\',n:'\n',r:'\r',t:'\t'})[escape];
    if(other)fail('invalidRegex');const key=group??num;const v=/^\d+$/.test(key)?m[Number(key)]:m.groups?.[key];
    if(v===undefined&&(/^\d+$/.test(key)?Number(key)>=m.length:!Object.hasOwn(m.groups??{},key)))fail('invalidRegex');return v??'';
  });
}
export function stringOperation(rows,columns,op){
  const p=op.params,method=p.method??'split',c=p.column,selected=method==='cat'?p.columns:[c];
  if(!Array.isArray(selected)||!selected.length||selected.some(k=>!columns.includes(k)))fail('missingColumn');
  const methods=['split','rsplit','extract','regexReplace','cat','pad','zfill','containsRegex','matchRegex','fullmatchRegex','countRegex','findall'];if(!methods.includes(method))fail('invalidOperation');
  const prefix=String(p.prefix??'text_'),name=String(p.name??'text_result'),pattern=String(p.pattern??''),flags=p.ignoreCase==='include'?'i':'';
  const n=Number(p.n??-1);if(!Number.isInteger(n)||n< -1)fail('invalidNumber');const limit=n===0?-1:n;
  let names,values,totalCharacters=0,listItems=0;
  const guarded=value=>{if(value){const visit=v=>{if(Array.isArray(v)){listItems+=v.length;if(listItems>2000000)fail('tooManyRows');for(const item of v)visit(item);}else if(typeof v==='string')totalCharacters+=v.length;};for(const v of value)visit(v);if(totalCharacters>20*1048576)fail('stringOutputLimit');}return value;};
  const checkNames=()=>{if(names.some(k=>!k.trim()||columns.includes(k))||new Set(names).size!==names.length)fail('duplicateColumns');if(columns.length+names.length>200||rows.length*(columns.length+names.length)>2000000)fail('tooManyRows');};
  if(method==='split'||method==='rsplit'){
    const mode=p.splitMode??'literal';if(!['literal','regex','whitespace'].includes(mode)||method==='rsplit'&&mode==='regex')fail('invalidOperation');
    if(mode==='regex')regex(pattern);
    values=rows.map(r=>{const s=text(r[c]);return s===null?null:guarded(split(s,pattern,limit,mode,method==='rsplit'));});
    const width=Math.max(1,...values.map(v=>v?.length??0));if(columns.length+width>200||rows.length*(columns.length+width)>2000000)fail('tooManyRows');
    names=Array.from({length:width},(_,i)=>prefix+i);
  }else if(method==='extract'){
    const r=regex(pattern,flags),groups=captures(pattern);if(!groups.length)fail('regexGroups');names=groups.map(k=>prefix+k);checkNames();
    values=rows.map(row=>{r.lastIndex=0;const s=text(row[c]),m=s===null?null:r.exec(s);return guarded(groups.map((_,i)=>m?.[i+1]??null));});
  }else{
    names=[name];checkNames();let convert;
    if(method==='cat')convert=row=>{const parts=selected.map(k=>text(row[k]));return parts.includes(null)&&p.missing!=='include'?null:parts.map(v=>v??String(p.naRep??'')).join(String(p.separator??''));};
    else if(method==='pad'||method==='zfill'){
      const width=Number(p.width??10),fill=String(p.fillChar??' '),side=p.side??'left';if(!Number.isInteger(width)||width<0||width>10000)fail('invalidNumber');if(method==='pad'&&([...fill].length!==1||!['left','right','both'].includes(side)))fail('invalidOperation');
      convert=row=>{const s=text(row[c]);if(s===null)return null;const len=[...s].length,d=Math.max(0,width-len);if(method==='zfill')return /^[+-]/.test(s)?s[0]+'0'.repeat(d)+s.slice(1):'0'.repeat(d)+s;const left=side==='left'?d:side==='right'?0:Math.floor(d/2)+(d%2&&width%2?1:0);return fill.repeat(left)+s+fill.repeat(d-left);};
    }else{
      const r=regex(pattern,flags);convert=row=>{const s=text(row[c]);if(s===null)return null;r.lastIndex=0;const matches=s.matchAll(r);
        if(method==='containsRegex')return r.test(s);if(method==='matchRegex')return r.exec(s)?.index===0;if(method==='fullmatchRegex'){const full=regex(`(?:${pattern})(?![\\s\\S])`,flags);full.lastIndex=0;const m=full.exec(s);return m?.index===0;}
        if(method==='findall'){const out=[];for(const m of matches){out.push(m.length===1?m[0]:m.length===2?m[1]??'':m.slice(1).map(v=>v??''));if(out.length>100000)fail('tooManyRows');}return out;}
        if(method==='countRegex'){let count=0;for(const _ of matches)count++;return count;}
        let result='',last=0,count=0;for(const m of matches){if(limit>=0&&count>=limit)break;result+=s.slice(last,m.index)+replacement(String(p.replacement??''),m);last=m.index+m[0].length;count++;}return result+s.slice(last);};
    }
    values=rows.map(row=>guarded([convert(row)]));
  }
  if(names.some(k=>!k.trim()||columns.includes(k))||new Set(names).size!==names.length)fail('duplicateColumns');
  if(columns.length+names.length>200||rows.length*(columns.length+names.length)>2000000)fail('tooManyRows');
  const output=rows.map((row,i)=>Object.fromEntries([...columns.map(k=>[k,row[k]]),...names.map((k,j)=>[k,values[i]?.[j]??null])]));
  const valid=values.filter(v=>v?.some(x=>x!==null)).length;
  return {columns:[...columns,...names],rows:output,analysis:{kind:'strings',method,fields:names,total:rows.length,valid,samples:rows.slice(0,20).map((row,i)=>({before:selected.map(k=>({name:k,value:row[k]})),after:names.map(k=>({name:k,value:output[i][k]}))}))}};
}
