import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateSpin,evaluateFeatureSpin,evaluateLines,createRules} from '../engine/rules.js';
import {MODES,FEATURE_MODES,paylines,GEM_VALUES} from '../engine/config.js';
import {WHEEL_SEGMENTS} from '../presentation/wheel.js';
const matrix=s=>Array.from({length:4},()=>Array(4).fill(s));
test('supplied weights, duplicated lines and cash values are preserved',()=>{
  assert.deepEqual(MODES,[['A',3000],['B',6100],['C',799],['D',100],['E',1]]);
  assert.deepEqual(FEATURE_MODES,[['FA',500],['FB',200],['FC',200],['FD',100]]);
  assert.deepEqual(paylines[10],paylines[11]);
  assert.deepEqual(GEM_VALUES,{Z:10,Y:5,X:4,V:3,U:2,S:1,R:.5});
});
test('no-award modes suppress both line wins and scatter triggers',()=>{
  assert.equal(evaluateSpin('B',matrix('M')).totalWin,0);
  assert.equal(evaluateSpin('B',matrix('F')).freeSpins,0);
  assert.equal(evaluateFeatureSpin('FC',matrix('Z')).totalWin,0);
});
test('wheel collect pays cash without a visible W and without cash line substitution',()=>{
  for(const mode of ['C','FA']){
    const result=mode==='FA'?evaluateFeatureSpin(mode,matrix('Z')):evaluateSpin(mode,matrix('Z'));
    assert.equal(result.wPositions.length,0);assert.equal(result.collectorActive,true);
    assert.equal(result.collectorAmount,160);assert.equal(result.lineWin,0);
  }
  const m=matrix('F');m[0][0]='R';m[3][3]='Y';
  assert.equal(evaluateSpin('C',m).collectorAmount,5.5);
});
test('wild modes transform all cash into W and never collect its cash value',()=>{
  for(const mode of ['A','FB']){
    const result=mode==='A'?evaluateSpin(mode,matrix('Z')):evaluateFeatureSpin(mode,matrix('Z'));
    assert.deepEqual(result.lineMatrix,matrix('W'));assert.equal(result.totalWin,120);
    assert.equal(result.collectorAmount,0);assert.equal(result.wildActive,true);
  }
});
test('wild substitutes ordinary symbols, chooses highest line and excludes cash/scatter',()=>{
  const m=matrix('F');m[0][1]='W';m[1][1]='M';m[2][1]='M';m[3][1]='M';
  assert.equal(evaluateLines(m).total,10);
  m[1][1]='Z';assert.equal(evaluateLines(m).total,0);
  assert.equal(evaluateLines(matrix('W')).total,120);
});
test('three/four scatters award five/eight spins only in enabled base modes',()=>{
  const m=matrix('J');m[0][0]=m[1][0]=m[2][0]='F';
  for(const mode of ['A','C','D','E'])assert.equal(evaluateSpin(mode,m).freeSpins,5);
  m[3][0]='F';assert.equal(evaluateSpin('D',m).freeSpins,8);
  assert.equal(evaluateFeatureSpin('FA',m).freeSpins,0);
});
test('wheel mappings match every rule mode and rule import matches source strips',()=>{
  const reels=JSON.parse(fs.readFileSync(new URL('../reels.json',import.meta.url)));
  const source=fs.readFileSync(new URL('../../CashCollect.txt',import.meta.url),'utf8');
  const strips=[...source.matchAll(/^:reelband (\w+) ([^;]+);/gm)];
  assert.equal(strips.length,36);
  for(const [,name,strip] of strips)assert.deepEqual(reels[name],strip.split(','));
  const rules=createRules(reels);
  for(const [mode] of [...MODES,...FEATURE_MODES]){
    const record=rules.resolve(mode.startsWith('F'),{mode,stops:[0,0,0,0]});
    assert.equal(record.result.wheelKind,WHEEL_SEGMENTS[mode].kind);
  }
  assert.throws(()=>rules.resolve(true,{mode:'A',stops:[0,0,0,0]}),/spin type/);
});

 test('D awards scatters only, with no collection, lines or wild transformation',()=>{
  for(const symbol of ['Z','M','W']){
    const result=evaluateSpin('D',matrix(symbol));
    assert.equal(result.totalWin,0);assert.equal(result.collectorActive,false);assert.equal(result.wildActive,false);
  }
  const m=matrix('Z');m[0][0]=m[1][0]=m[2][0]='F';
  assert.equal(evaluateSpin('D',m).freeSpins,5);assert.equal(evaluateSpin('D',m).totalWin,0);
  m[3][0]='F';assert.equal(evaluateSpin('D',m).freeSpins,8);
});

test('FD doubles cash and line prizes exactly once while FA retains ordinary values',()=>{
  assert.equal(evaluateFeatureSpin('FD',matrix('Z')).collectorAmount,320);
  assert.equal(evaluateFeatureSpin('FA',matrix('Z')).collectorAmount,160);
  const fd=evaluateFeatureSpin('FD',matrix('M')),fa=evaluateFeatureSpin('FA',matrix('M'));
  assert.equal(fd.lineWin,fa.lineWin*2);assert.equal(fd.totalWin,fa.totalWin*2);
  for(let i=0;i<fd.lineWins.length;i++)assert.equal(fd.lineWins[i].amount,fa.lineWins[i].amount*2);
  assert.equal(fd.prizeMultiplier,2);
});
