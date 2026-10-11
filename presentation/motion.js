export const wrap = (value, length) => ((value % length) + length) % length;

// Integrate smoothstep velocity: no speed or acceleration jumps at either join.
const rampIntegral=q=>q*q*q-.5*q*q*q*q;
const smoothstep=q=>q*q*(3-2*q);
const acceleration=.09,deceleration=.16,cruiseEnd=1-deceleration;
const travel=1-(acceleration+deceleration)/2;
export function reelProgress(t){
  t=Math.max(0,Math.min(1,t));
  if(t<acceleration)return acceleration*rampIntegral(t/acceleration)/travel;
  if(t<cruiseEnd)return (acceleration/2+t-acceleration)/travel;
  const q=(t-cruiseEnd)/deceleration;
  return (acceleration/2+cruiseEnd-acceleration+deceleration*(q-rampIntegral(q)))/travel;
}
export function reelVelocity(t){
  t=Math.max(0,Math.min(1,t));
  if(t<acceleration)return smoothstep(t/acceleration)/travel;
  if(t<cruiseEnd)return 1/travel;
  return (1-smoothstep((t-cruiseEnd)/deceleration))/travel;
}

export function anticipationPlan(distance, velocity, cruiseMs, decelMs = 500) {
  const cruiseTravel = velocity * cruiseMs;
  const targetDistance = Math.ceil(distance + Math.max(7, cruiseTravel + 4, cruiseTravel + velocity * decelMs / 3));
  return { startDistance: distance, startVelocity: velocity, cruiseMs, decelMs, targetDistance };
}

export function anticipationDistance(plan, elapsed) {
  if (elapsed < plan.cruiseMs) return plan.startDistance + plan.startVelocity * elapsed;
  const u = Math.min(1, Math.max(0, (elapsed - plan.cruiseMs) / plan.decelMs));
  const from = plan.startDistance + plan.startVelocity * plan.cruiseMs;
  const travel = plan.targetDistance - from;
  // Hermite approach: continuous incoming velocity, zero final velocity, no reversal.
  const tangent = plan.startVelocity * plan.decelMs;
  return from + travel * (3 * u * u - 2 * u * u * u) + tangent * (u * u * u - 2 * u * u + u);
}

export function presentationStrip(real, start, targetDistance, targetSymbols) {
  const strip = real.slice(), center = wrap(start - targetDistance, strip.length);
  for (let r = 0; r < targetSymbols.length; r++) strip[wrap(center - 1 + r, strip.length)] = targetSymbols[r];
  return { strip, center };
}
