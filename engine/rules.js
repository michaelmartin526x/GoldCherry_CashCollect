import {MODES,FEATURE_MODES,MODE_RULES,FREE_SPIN_AWARDS,paylines,pay,GEM_VALUES,GEM_SYMBOLS} from './config.js';
export const transformGemsToWild=m=>m.map(col=>col.map(s=>GEM_SYMBOLS.has(s)?'W':s));
export function evaluateLines(matrix){
  const wins=[];let total=0;
  paylines.forEach((line,i)=>{
    const seq=line.map(([c,r])=>matrix[c][r]);let best=null;
    for(const symbol of Object.keys(pay)){
      let count=0;
      while(count<4&&(seq[count]===symbol||(symbol!=='W'&&seq[count]==='W')))count++;
      if(count<3)continue;
      const amount=pay[symbol][count-1]/100;
      if(!best||amount>best.amount)best={line:i+1,symbol,count,amount,positions:line.slice(0,count)};
    }
    if(best){wins.push(best);total+=best.amount;}
  });
  return {total,wins};
}
export const scatter=m=>m.flat().filter(s=>s==='F').length;
function evaluate(mode,matrix){
  const rule=MODE_RULES[mode];if(!rule)throw new Error('Invalid mode: '+mode);
  const gems=[],wPositions=[];
  for(let c=0;c<4;c++)for(let r=0;r<4;r++){
    const s=matrix[c][r];if(s==='W')wPositions.push([c,r]);
    if(GEM_SYMBOLS.has(s))gems.push({symbol:s,value:GEM_VALUES[s],position:[c,r]});
  }
  const lineMatrix=rule.wild?transformGemsToWild(matrix):matrix;
  const lineResult=rule.lines?evaluateLines(lineMatrix):{total:0,wins:[]};
  const collectorAmount=rule.collect?gems.reduce((sum,g)=>sum+g.value,0):0;
  const scatterCount=rule.trigger?scatter(matrix):0;
  const awardCount=Object.keys(FREE_SPIN_AWARDS).map(Number).filter(count=>scatterCount>=count).sort((a,b)=>b-a)[0];
  const freeSpins=awardCount?FREE_SPIN_AWARDS[awardCount]:0;
  return {mode,lineMatrix,lineWins:lineResult.wins,lineWin:lineResult.total,gems,wPositions,
    collectorActive:rule.collect&&gems.length>0,collectorMultiplier:rule.collect?1:0,
    collectorAmount,scatterCount,freeSpins,wildActive:rule.wild,
    wheelKind:rule.wild?'wild':mode==='D'?'feature':rule.collect?'collect':'blank',
    totalWin:lineResult.total+collectorAmount};
}
export const evaluateSpin=(mode,m)=>{if(!MODES.some(([name])=>name===mode))throw new Error('Invalid base mode');return evaluate(mode,m);};
export const evaluateFeatureSpin=(mode,m)=>{if(!FEATURE_MODES.some(([name])=>name===mode))throw new Error('Invalid feature mode');return evaluate(mode,m);};
export function createRules(reels,random=Math.random){
  const modes=Object.keys(MODE_RULES),symbols=new Set([...Object.keys(pay),...GEM_SYMBOLS,'F']);
  for(const mode of modes)for(let c=1;c<=4;c++){
    const strip=reels['reel'+mode+c];
    if(!Array.isArray(strip)||strip.length<4||strip.some(s=>!symbols.has(s)))throw new Error('Invalid reel strip: '+mode+c);
  }
  const chooseWeighted=weights=>{let x=random()*weights.reduce((sum,[,w])=>sum+w,0);for(const [m,w] of weights){x-=w;if(x<0)return m;}return weights.at(-1)[0];};
  const chooseMode=()=>chooseWeighted(MODES);
  const chooseStops=mode=>Array.from({length:4},(_,c)=>Math.floor(random()*reels['reel'+mode+(c+1)].length));
  const matrixFromStops=(mode,stops)=>{
    if(!modes.includes(mode)||stops.length!==4)throw new Error('Invalid stops');
    return stops.map((stop,c)=>{const strip=reels['reel'+mode+(c+1)];if(!Number.isInteger(stop)||stop<0||stop>=strip.length)throw new Error('Invalid stop');return Array.from({length:4},(_,r)=>strip[(stop+r-1+strip.length)%strip.length]);});
  };
  const previewCashStops=mode=>Array.from({length:4},(_,c)=>{
    const strip=reels['reel'+mode+(c+1)];
    const found=strip.findIndex((_,p)=>Array.from({length:4},(_,r)=>strip[(p+r-1+strip.length)%strip.length]).some(s=>GEM_SYMBOLS.has(s)));
    return Math.max(0,found);
  });
  return {chooseMode,chooseStops,matrixFromStops,previewCashStops,resolve(isFeature=false,forced){
    const mode=forced?.mode??chooseWeighted(isFeature?FEATURE_MODES:MODES);
    if(!(isFeature?FEATURE_MODES:MODES).some(([name])=>name===mode))throw new Error('Mode does not match spin type');
    const stops=forced?.stops?.slice()??chooseStops(mode),matrix=matrixFromStops(mode,stops);
    return {mode,stops,matrix,result:isFeature?evaluateFeatureSpin(mode,matrix):evaluateSpin(mode,matrix)};
  }};
}
