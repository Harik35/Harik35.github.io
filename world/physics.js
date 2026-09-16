import RAPIER from '@dimforge/rapier3d-compat';

export async function createPhysics(exhibits) {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
  const solid = (x, z, width, depth) => world.createCollider(
    RAPIER.ColliderDesc.cuboid(width / 2, 2, depth / 2).setTranslation(x, 2, z)
  );
  solid(-14, 0, .5, 28); solid(14, 0, .5, 28);
  solid(0, -13, 28, .5); solid(0, 13, 28, .5);
  world.createCollider(RAPIER.ColliderDesc.cylinder(.8, 2.9).setTranslation(0, .8, -1));
  for (const e of exhibits) solid(e.x, e.z, e.angle ? 2.6 : 6, e.angle ? 6 : 2.6);
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 1, 8));
  const collider = world.createCollider(RAPIER.ColliderDesc.capsule(.55, .3), body);
  const controller = world.createCharacterController(.03);
  controller.setSlideEnabled(true);
  world.step();
  function move(x, z, dt) {
    const position = body.translation();
    controller.computeColliderMovement(collider, { x: x * 3.6 * dt, y: 0, z: z * 3.6 * dt });
    const delta = controller.computedMovement();
    body.setNextKinematicTranslation({ x: position.x + delta.x, y: 1, z: position.z + delta.z });
    world.timestep = dt || 1 / 60;
    world.step();
    return body.translation();
  }
  function reset(x = 0, z = 8) {
    body.setTranslation({ x, y: 1, z }, true);
    body.setNextKinematicTranslation({ x, y: 1, z });
    world.step();
  }
  return { world, body, move, reset };
}
