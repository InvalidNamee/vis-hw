// Keep equality semantics stable when an object-like index is filtered to a single primitive type.
export function booleanNumericLevels(values,levels){return Array.from({length:levels},(_,i)=>{const types=new Set(values.map(tuple=>tuple[i]==null||tuple[i]===''?'missing':typeof tuple[i]));return types.has('boolean')&&types.size>1||types.has('number')&&types.has('string');});}
