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
  const car = advance(0, -1, 100);
  assert.ok(car.z > .5, 'The Camaro display must stop entry from the front.');
  physics.reset(-5, -1);
  const side = advance(1, 0, 60);
  assert.ok(side.x < -2.5, 'The Camaro display must stop entry from the side.');
  for (const x of [-4.5, 4.5]) {
    physics.reset(x, 4);
    const passage = advance(0, -1, 120);
    assert.ok(passage.z < -3, 'Both passages around the Camaro must remain open.');
  }
  physics.reset(7, 5);
  const booth = advance(0, -1, 400);
  assert.ok(booth.z > -6.5 && booth.z < -6.2, 'The project booth must block entry.');
  physics.reset(0, 8);
  const wall = advance(1, 0, 600);
  assert.ok(wall.x < 13.5 && wall.x > 13.2, 'The character must stay inside the perimeter.');
  physics.reset();
  assert.ok(Math.abs(physics.body.translation().z - 8) < .001, 'Reset must restore the entrance position.');
  console.log('PASS: movement, Camaro collision and passages, booth collision, wall boundary, entrance reset.');
} finally {
  physics.world.free();
}
