import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GEM_VALUES,LAYOUT} from '../engine/config.js';

test('every cash skeleton has its value label inside the symbol cell',()=>{
  for(const symbol of Object.keys(GEM_VALUES)){
    const skeleton=JSON.parse(fs.readFileSync(new URL(`../assets/spine/${symbol}.json`,import.meta.url),'utf8'));
    const name=`${symbol}_cash`;
    const slot=skeleton.slots.find(slot=>slot.name===name);
    assert.equal(slot?.attachment,name,`${symbol}: value attachment must be visible in setup pose`);
    const bone=skeleton.bones.find(bone=>bone.name===slot.bone);
    const label=skeleton.skins[0].attachments[name][name];
    const centreY=(bone.y||0)+(label.y||0);
    assert.ok(Math.abs(centreY)+label.height/2<=LAYOUT.cellHeight/2,`${symbol}: value label extends outside cell (y=${centreY})`);
    assert.ok(Math.abs((bone.x||0)+(label.x||0))+label.width/2<=LAYOUT.cellWidth/2,`${symbol}: value label exceeds cell width`);
  }
});
