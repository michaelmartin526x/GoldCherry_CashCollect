import test from 'node:test';
import assert from 'node:assert/strict';
import {createWheel,BASE_NO_AWARD_ANGLES,WHEEL_DURATION_MS,WHEEL_STOP_ANGLES,wheelTravel,tickerFrames} from '../presentation/wheel.js';

test('wheel rebound stays within its selected sector and ticker returns upright',()=>{
  for(let i=84;i<=100;i++)assert.ok(Math.abs(wheelTravel(i/100).bounce)<=3);
  assert.equal(wheelTravel(1).bounce,0);
  const frames=tickerFrames(0,720);
  assert.equal(frames[0].transform,'rotate(0deg)');
  assert.equal(frames.at(-1).transform,'rotate(0deg)');
  assert.ok(frames.some(frame=>frame.transform!=='rotate(0deg)'));
});

test('base collection mode stops on the single red collector sector',async()=>{
  for(const mode of ['C']){
    const rotor={dataset:{},style:{},nextElementSibling:{animate:()=>({cancel(){}})}};
    let finalTransform;
    rotor.animate=(frames)=>{
      finalTransform=frames.at(-1).transform;
      return {finished:Promise.resolve(),cancel(){}};
    };
    await createWheel({rotor,label:{}}).present({mode,isFeature:false});
    assert.equal(rotor.src,'assets/BaseWheel.png');
    assert.equal(finalTransform,'rotate(360deg)',`${mode} must finish at the red sector's 0-degree orientation`);
    assert.equal(rotor.style.transform,finalTransform);
  }
});

test('base B can reach every black/grey sector with synchronized slower wheel and blur',async()=>{
  const stops=[];
  for(let index=0;index<12;index++){
    const durations=[];
    const rotor={dataset:{},style:{},nextElementSibling:{animate:(frames,options)=>{durations.push(options.duration);return {cancel(){}};}}};
    rotor.animate=(frames,options)=>{
      durations.push(options.duration);
      stops.push((360-Number(frames.at(-1).transform.match(/[\d.]+/)[0])%360)%360);
      return {finished:Promise.resolve(),cancel(){}};
    };
    await createWheel({rotor,label:{},random:()=>(index+.5)/12}).present({mode:'B',isFeature:false});
    assert.deepEqual(durations,[2500,2500]);
  }
  assert.equal(WHEEL_DURATION_MS,2500);
  assert.deepEqual(stops,BASE_NO_AWARD_ANGLES);
  assert.equal(new Set(stops).size,12);
  for(const angle of stops)assert.ok(![0,90,180,270].includes(angle));
});

test('revised base and feature modes reach only their matching artwork sectors',async()=>{
  const expected={A:[90,180,270],C:[0],E:[0],FD:[0],D:[22.5,45,67.5,112.5,135,157.5,202.5,225,247.5,292.5,315,337.5],FA:[45,90,135,180,225,315],FB:[22.5,67.5,112.5,202.5,247.5,292.5],FC:[157.5,270,337.5]};
  for(const [mode,angles] of Object.entries(expected)){
    assert.deepEqual(WHEEL_STOP_ANGLES[mode],angles);
    for(let i=0;i<angles.length;i++){
      let final;
      const rotor={dataset:{},style:{},nextElementSibling:{animate:()=>({cancel(){}})},animate:frames=>{final=Number(frames.at(-1).transform.match(/[\d.]+/)[0]);return {finished:Promise.resolve(),cancel(){}};}};
      await createWheel({rotor,random:()=>(i+.5)/angles.length}).present({mode,isFeature:mode.startsWith('F')});
      assert.equal((360-final%360)%360,angles[i]);
      assert.equal(rotor.src,`assets/${mode.startsWith('F')?'Feature':'Base'}Wheel.png`);
    }
  }
});
