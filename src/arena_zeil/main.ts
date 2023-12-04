import { getObjectsByPrototype, getTicks } from "game/utils";
import { BodyBuilder, getCreepsByKind, logCreeps } from "./creep";
import { getStructureByKind } from "./structure";
import { Source, StructureSpawn } from "game/prototypes";
import { SafeCreep } from "./creep/safeCreep";
import { ATTACK, BodyPartConstant, RANGED_ATTACK, RESOURCE_ENERGY } from "game/constants";

const rangedAttackerBody = new BodyBuilder().rangedAttack(2).tough(0).move(2).build();
const attackerBody = new BodyBuilder().attack(2).tough(0).move(2).build();
const workerBody = new BodyBuilder().work(1).carry(1).move().build();
const healerBody = new BodyBuilder().heal(1).move().build();

export function loop(): void {
  console.log(`The time is ${getTicks()}`);
  logCreeps();
  const { workers, attackers, rangedAttackers, healers, enemies } = getCreepsByKind();
  const { spawners } = getStructureByKind();
  const mySpawn = spawners.find(s => s.my) as StructureSpawn;
  const spawnFinished = doTasksSeq([
    () => {
      return doSpawnRequests(mySpawn, [
        {
          bodyParts: workerBody,
          currentNum: workers.length,
          expectNum: 0
        }
      ]);
    },
    () => {
      return doSpawnRequests(mySpawn, [
        {
          bodyParts: attackerBody,
          currentNum: attackers.length,
          expectNum: 2
        },
        {
          bodyParts: rangedAttackerBody,
          currentNum: rangedAttackers.length,
          expectNum: 0
        },
        {
          bodyParts: healerBody,
          currentNum: healers.length,
          expectNum: 0
        }
      ]);
    }
  ]);
  runWorkers(workers, mySpawn);
  const allKindAttackers = [...attackers, ...rangedAttackers];
  collectArmy([...allKindAttackers, ...healers], mySpawn);
  if (spawnFinished) {
    doAttack(allKindAttackers, enemies);
    moveHealersToAttackers(healers, allKindAttackers);
    doHeal(healers, allKindAttackers);
  }
}

function runWorkers(workers: SafeCreep[], mySpawn: StructureSpawn) {
  const source = getObjectsByPrototype(Source)[0];
  for (const w of workers) {
    w.harvestOrTransfer(source, mySpawn, RESOURCE_ENERGY);
  }
}

function collectArmy(members: SafeCreep[], mySpawn: StructureSpawn) {
  const collectPoint = {
    x: mySpawn.x - 3,
    y: mySpawn.y - 3
  };
  for (const a of members) {
    a.creep.moveTo(collectPoint);
  }
}

function doAttack(attackers: SafeCreep[], enemies: SafeCreep[]) {
  for (const a of attackers) {
    for (const e of enemies) {
      if (a.isMatchKind(ATTACK)) {
        a.attack(e.creep);
      }
      if (a.isMatchKind(RANGED_ATTACK)) {
        a.attack(e.creep);
      }
    }
  }
}

function moveHealersToAttackers(healers: SafeCreep[], attackers: SafeCreep[]) {
  if (attackers.length >= 1) {
    const target = attackers[0];
    for (const h of healers) {
      h.creep.moveTo(target.creep);
    }
  }
}

function doHeal(healers: SafeCreep[], attackers: SafeCreep[]) {
  for (const h of healers) {
    h.autoHeal(attackers);
  }
}

export interface SpawnRequest {
  bodyParts: BodyPartConstant[];
  currentNum: number;
  expectNum: number;
  finished?: boolean;
}

type taskFunction = () => boolean;

function doTasksSeq(tasks: taskFunction[]): boolean {
  for (let i = 0; i < tasks.length; i++) {
    if (!tasks[i]()) {
      return false;
    }
    console.log(`finish task ${i} at tick ${getTicks()}`);
  }

  return true;
}

function doSpawnRequests(mySpawn: StructureSpawn, requests: SpawnRequest[]): boolean {
  for (const rq of requests) {
    //     console.log(`
    // do spawn request:
    // body: ${rq.bodyParts}
    // current: ${rq.currentNum}
    // expect: ${rq.expectNum}
    // `);
    spawnCreeps(mySpawn, rq);
  }
  for (const rq of requests) {
    if (!rq.finished) {
      return false;
    }
  }
  return true;
}

function spawnCreeps(mySpawn: StructureSpawn, request: SpawnRequest) {
  if (request.currentNum < request.expectNum) {
    const err = mySpawn.spawnCreep(request.bodyParts).error;
  }
  request.finished = true;
}