import script from './script-data.js';
export const MODES=script.baseWeights;
export const FEATURE_MODES=script.featureWeights;
// Design correction: D is scatter entry only; keep the supplied source script intact.
export const MODE_RULES={...script.modes,D:{...script.modes.D,wild:false,collect:false,lines:false,trigger:true},FD:{...script.modes.FD,prizeMultiplier:2}};
export const FREE_SPIN_AWARDS=script.freeSpins;
export const paylines=script.paylines;
export const pay=script.pay;
export const GEM_VALUES=script.gems;
export const GEM_SYMBOLS=new Set(Object.keys(GEM_VALUES));
export const LAYOUT=Object.freeze({columns:4,rows:4,cellWidth:165,cellHeight:145});
export const MOTION=Object.freeze({durations:[1500,1750,2000,2250],steps:[22,26,30,34]});
export const DECLARED_RTP=script.declaredRtp;
export const SPINE_SYMBOLS=['A','D','E','F','G','J','K','M','Q','R','S','T','U','V','W','X','Y','Z'];
// This pack supplies wheel blur artwork but no blurred reel symbols.
export const BLUR_SYMBOLS=new Set();
