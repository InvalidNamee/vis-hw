import {readWorkbook} from './workbook.mjs';
self.onmessage=async(event)=>{try{self.postMessage({result:await readWorkbook(event.data.buffer)});}catch(error){self.postMessage({error:error instanceof Error?error.message:'invalidWorkbook'});}};
