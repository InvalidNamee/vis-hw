import ExcelJS from 'exceljs';import {parseData} from './model.mjs';
const fail=k=>{throw new Error(k);};
export function cellValue(cell){
 if(cell.isMerged&&cell.master.address!==cell.address)return null;
 const v=cell.value;if(v==null)return null;if(v instanceof Date)return Number.isFinite(+v)?v.toISOString().replace(/Z$/,''):null;
 if(typeof v==='number')return Number.isFinite(v)?v:null;if(['string','boolean'].includes(typeof v))return v;
 if(typeof v==='object'){if(Object.hasOwn(v,'formula')||Object.hasOwn(v,'sharedFormula'))return cellValue({value:v.result});if(Array.isArray(v.richText))return v.richText.map(p=>p.text??'').join('');if(typeof v.text==='string')return v.text;if(v.error)return null;}
 fail('invalidWorkbook');
}
function expandedLimit(buffer){const view=new DataView(buffer instanceof ArrayBuffer?buffer:buffer.buffer,buffer.byteOffset??0,buffer.byteLength);for(let end=view.byteLength-22;end>=Math.max(0,view.byteLength-65558);end--){if(view.getUint32(end,true)!==0x06054b50)continue;let pos=view.getUint32(end+16,true),total=0;const count=view.getUint16(end+10,true);if(count===65535)fail('workbookExpandedLimit');for(let i=0;i<count;i++){if(pos+46>view.byteLength||view.getUint32(pos,true)!==0x02014b50)fail('invalidWorkbook');const size=view.getUint32(pos+24,true);total+=size;if(size===0xffffffff||total>128*1048576)fail('workbookExpandedLimit');pos+=46+view.getUint16(pos+28,true)+view.getUint16(pos+30,true)+view.getUint16(pos+32,true);}return;}fail('invalidWorkbook');}
export async function readWorkbook(buffer){
 if(buffer.byteLength>10*1048576)fail('fileTooLarge');expandedLimit(buffer);let workbook;try{workbook=new ExcelJS.Workbook();await workbook.xlsx.load(buffer);}catch{fail('invalidWorkbook');}
 const sheets=[];let characters=0;
 for(const sheet of workbook.worksheets){
  if(sheet.rowCount<2)continue;if(sheet.columnCount>200||sheet.rowCount>100001||(sheet.rowCount-1)*sheet.columnCount>2000000)fail('tooManyRows');
  const header=sheet.getRow(1),used=new Set(),bases=Array.from({length:sheet.columnCount},(_,i)=>{const v=cellValue(header.getCell(i+1));return v==null||String(v).trim()===''?`Unnamed: ${i}`:String(v).trim();}),reserved=new Set(bases),columns=bases.map(base=>{let key=base,j=1;if(used.has(key)){do{key=base+'.'+j++;}while(used.has(key)||reserved.has(key));}used.add(key);return key;});
  const rows=[];for(let i=2;i<=sheet.rowCount;i++){const row=sheet.getRow(i),values=columns.map((_,j)=>cellValue(row.getCell(j+1)));rows.push(Object.fromEntries(columns.map((c,j)=>[c,values[j]])));}
  // Match tabular readers: retain interior blank rows, drop empty trailing rows.
  while(rows.length&&columns.every(c=>rows.at(-1)[c]==null||rows.at(-1)[c]===''))rows.pop();if(!rows.length)continue;
  const raw=JSON.stringify(rows);characters+=raw.length;if(characters>20*1048576)fail('workspaceLimit');sheets.push({name:sheet.name,format:'json',raw,...parseData(raw,'json')});if(sheets.length>20)fail('workspaceLimit');
 }
 if(!sheets.length)fail('emptyFile');return sheets;
}
