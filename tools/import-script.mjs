import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../CashCollect.txt',import.meta.url),'utf8');
// Read active directives only. Comments in the supplied script are reference data.
const active=source.split(/\r?\n/).map(line=>line.split('//')[0].trim()).filter(Boolean).join('\n');
const reels=Object.fromEntries([...active.matchAll(/:reelband\s+(\w+)\s+([^;]+);/g)].map(([,name,strip])=>[name,strip.trim().split(',')]));
const paylines=[...active.matchAll(/:payline\s+payline(\d{2})\s+([^;]+);/g)].map(([,id,positions])=>positions.trim().split(/\s+/).map(p=>p.split(',').map(Number)));
const pay={};
for(const [,count,symbol,value] of active.matchAll(/:winlineLRV\s+\w+\s+([34])\s+(\w+)\s+(\d+);/g)){
  pay[symbol]??=[0,0,0,0];pay[symbol][Number(count)-1]=Number(value);
}
const gems=Object.fromEntries([...active.matchAll(/:winlineLRV\s+winline1([A-Z])\s+1\s+(\w+)\s+(\d+);/g)].map(([,id,symbol,value])=>[symbol,Number(value)/100]));
const weights=name=>{const block=active.match(new RegExp(':chanceWinLineStart '+name+';([\\s\\S]*?):chanceWinLineEnd;'))[1];return [...block.matchAll(/:useWinLine\s+winlineGame(\w+)\s+(\d+);/g)].map(([,mode,weight])=>[mode,Number(weight)]);};
const modes={};
for(const [,mode,body] of active.matchAll(/:gamestart\s+game(A|B|C|D|E|FA|FB|FC|FD);([\s\S]*?):gameend;/g)){
  modes[mode]={wild:body.includes(':useMatrixTransformSymbols'),lines:body.includes(':usepaytable paytableAll'),collect:body.includes(':usepaytable paytableCashAll'),trigger:body.includes(':usepaytable paytableScatterFree')};
}
const freeSpins=Object.fromEntries([...active.matchAll(/:winlineScatterNCG\s+\w+\s+(\d+)\s+F\s+gameFree\s+(\d+);/g)].map(([,count,award])=>[count,Number(award)]));
const data={paylines,pay,gems,baseWeights:weights('ChanceGame96'),featureWeights:weights('ChanceGameFree'),modes,freeSpins,declaredRtp:Number(source.match(/\/\/ RTP ([\d.]+)/)[1])};
fs.writeFileSync(new URL('../reels.json',import.meta.url),JSON.stringify(reels,null,2)+'\n');
fs.writeFileSync(new URL('../engine/script-data.js',import.meta.url),'// Generated from the supplied CashCollect.txt by tools/import-script.mjs.\nexport default '+JSON.stringify(data,null,2)+';\n');
console.log(`Imported ${Object.keys(reels).length} strips, ${paylines.length} lines and ${Object.keys(modes).length} modes.`);
