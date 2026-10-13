import {readParquet} from './parquet.mjs';
self.onmessage=async(event)=>{try{self.postMessage({result:await readParquet(event.data.buffer)});}catch(error){self.postMessage({error:error instanceof Error?error.message:'invalidParquet'});}};
