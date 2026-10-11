// The wheel presents an already selected mode; it never selects a second result.
// Base C and D both collect, so both point to the single red/pink sector at 0 degrees.
export const WHEEL_SEGMENTS={A:{angle:45,label:'WILD',kind:'wild'},B:{angle:22.5,label:'NO AWARD',kind:'blank'},C:{angle:0,label:'CASH COLLECT',kind:'collect'},D:{angle:0,label:'FEATURE CHANCE + COLLECT',kind:'feature'},FA:{angle:0,label:'CASH COLLECT',kind:'collect'},FB:{angle:22.5,label:'WILD',kind:'wild'},FC:{angle:337.5,label:'NO AWARD',kind:'blank'}};
export const BASE_NO_AWARD_ANGLES=[22.5,67.5,90,112.5,135,157.5,202.5,225,247.5,270,292.5,337.5];
export const WHEEL_DURATION_MS=2500;
export function createWheel({rotor,random=Math.random}){
  let rotation=0;
  return {async present(record){
    const segment=WHEEL_SEGMENTS[record.mode];if(!segment)throw new Error('Unknown wheel mode');
    const feature=record.isFeature;
    // Cosmetic choice only: B has already been resolved as no-award by the engine.
    const angle=record.mode==='B'&&!feature?BASE_NO_AWARD_ANGLES[Math.floor(random()*BASE_NO_AWARD_ANGLES.length)]:segment.angle;
    rotor.src=`assets/${feature?'Feature':'Base'}Wheel.png`;
    const blur=rotor.nextElementSibling;
    blur.src=`assets/${feature?'Feature':'Base'}Wheel_blur.png`;
    rotor.dataset.mode=record.mode;rotor.dataset.kind=segment.kind;
    const normalized=((rotation%360)+360)%360,target=(360-angle)%360;
    const next=rotation+360+((target-normalized+360)%360);
    // A gentle zero-speed start and finish, with only one to two revolutions.
    const frames=Array.from({length:61},(_,i)=>{
      const t=i/60,p=t*t*t*(10+t*(-15+6*t));
      return {offset:t,transform:`rotate(${rotation+(next-rotation)*p}deg)`};
    });
    const options={duration:WHEEL_DURATION_MS,easing:'linear'};
    const animation=rotor.animate(frames,{...options,fill:'forwards'});
    const blurAnimation=blur.animate(frames.map(frame=>({...frame,opacity:.35*Math.sin(Math.PI*frame.offset)**2})),options);
    await animation.finished;rotation=next;rotor.style.transform=`rotate(${rotation}deg)`;animation.cancel();blurAnimation.cancel();
  }};
}
