const fail=k=>{throw new Error(k);};
export function toJSON(rows,columns){return JSON.stringify(rows.map(row=>Object.fromEntries(columns.map(c=>[c,Object.hasOwn(row,c)?row[c]??null:null]))),null,2);}
export async function fetchDataFile(address,format,fetcher=fetch,signal){
 let url;try{url=new URL(address);}catch{fail('invalidDataURL');}if(!['https:','http:'].includes(url.protocol)||url.username||url.password)fail('invalidDataURL');
 if(!['csv','tsv','json','xlsx','parquet'].includes(format))fail('unsupported');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000),abort=()=>controller.abort();if(signal?.aborted)controller.abort();signal?.addEventListener('abort',abort,{once:true});
 try{const response=await fetcher(url.href,{mode:'cors',credentials:'omit',redirect:'follow',signal:controller.signal});if(!response.ok)fail('dataFetchFailed');const length=Number(response.headers.get('content-length'));if(length>10*1048576)fail('fileTooLarge');
  const chunks=[];let size=0;if(response.body){const reader=response.body.getReader();while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>10*1048576){await reader.cancel();fail('fileTooLarge');}chunks.push(value);}}
  else{const value=new Uint8Array(await response.arrayBuffer());if(value.byteLength>10*1048576)fail('fileTooLarge');chunks.push(value);size=value.byteLength;}
  const buffer=new Uint8Array(size);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.byteLength;}
  const base=decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1)??'remote-data').replace(/[^\p{L}\p{N}_. -]/gu,'_'),name=base.toLowerCase().endsWith('.'+format)?base:base+'.'+format;
  return {buffer:buffer.buffer,name,format};
 }catch(error){if(['fileTooLarge','dataFetchFailed','invalidDataURL','unsupported'].includes(error.message))throw error;throw new Error('dataFetchFailed');}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
