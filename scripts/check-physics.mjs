import assert from 'node:assert/strict';
import { createPhysics } from '../world/physics.js';
import { exhibits } from '../world/scene.js';

const physics = await createPhysics(exhibits);
function advance(x, z, frames) {
  for (let i = 0; i < frames; i++) physics.move(x, z, 1 / 60);
  return physics.body.translation();
}
try {
  const free = advance(1, 0, 60);
  assert.ok(Math.abs(free.x - 3.6) < .05, 'Unobstructed movement must cover the expected distance.');
  physics.reset();
  const planter = advance(0, -1, 400);
  assert.ok(planter.z > 2.15 && planter.z < 2.5, 'The planter must stop the character.');
  physics.reset(7, 5);
  const booth = advance(0, -1, 400);
  assert.ok(booth.z > -6.5 && booth.z < -6.2, 'The project booth must block entry.');
  physics.reset(0, 8);
  const wall = advance(1, 0, 600);
  assert.ok(wall.x < 13.5 && wall.x > 13.2, 'The character must stay inside the perimeter.');
  physics.reset();
  assert.ok(Math.abs(physics.body.translation().z - 8) < .001, 'Reset must restore the entrance position.');
  console.log('PASS: movement, planter collision, booth collision, wall boundary, entrance reset.');
} finally {
  physics.world.free();
}
