import { BodyPartConstant, RESOURCE_ENERGY } from "game/constants";
import { Creep, Source, StructureSpawn } from "game/prototypes";
import { getObjectsByPrototype } from "game/utils";
import { BodyBuilder, getCreepsByKind } from "./creep";
import { SafeCreep } from "./creep/safeCreep";
import { getStructureByKind } from "./structure";

const rangedAttackerBody = new BodyBuilder().rangedAttack(2).tough(0).move(2).build();
const attackerBody = new BodyBuilder().attack(2).tough(1).move(1).build();
const workerBody = new BodyBuilder().work(2).carry(1).move().build();
const healerBody = new BodyBuilder().heal(1).move().build();

enum BattleStage {
  SpawnWorker,
  SpawnArmy,
  Attack
}

let stage = BattleStage.SpawnWorker;
export function loop(): void {
  // logCreeps();
  // console.log(`current stage: ${stage}`)
  const { workers, attackers, rangedAttackers, healers, enemies } = getCreepsByKind();
  const { spawners } = getStructureByKind();
  const mySpawn = spawners.find(s => s.my) as StructureSpawn;
  const allKindAttackers = [...attackers, ...rangedAttackers];

  switch (stage) {
    case BattleStage.SpawnWorker:
      if (
        doSpawnRequests(mySpawn, [
          {
            bodyParts: workerBody,
            num: workers.length,
            expectNum: 1
          }
        ])
      ) {
        stage = BattleStage.SpawnArmy;
      }
      break;
    case BattleStage.SpawnArmy:
      collectArmy([...allKindAttackers, ...healers], mySpawn);
      if (
        doSpawnRequests(mySpawn, [
          {
            bodyParts: attackerBody,
            num: attackers.length,
            expectNum: 1
          },
          {
            bodyParts: rangedAttackerBody,
            num: rangedAttackers.length,
            expectNum: 1
          },
          {
            bodyParts: healerBody,
            num: healers.length,
            expectNum: 0
          }
        ])
      ) {
        stage = BattleStage.Attack;
      }
      break;
    case BattleStage.Attack:
      doAttack(allKindAttackers, enemies);
      moveHealersToAttackers(healers, allKindAttackers);
      doHeal(healers, allKindAttackers);
      break;
    default:
      break;
  }
  runWorkers(workers, mySpawn);
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
    y: mySpawn.y
  };
  for (const a of members) {
    a.creep.moveTo(collectPoint);
  }
}

function doAttack(attackers: SafeCreep[], enemies: Creep[]) {
  for (const a of attackers) {
    a.autoDefense(enemies, 10);
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
  num: number;
  expectNum: number;
}

type taskFunction = () => boolean;

function doTasksSeq(tasks: taskFunction[]): boolean {
  for (let i = 0; i < tasks.length; i++) {
    if (!tasks[i]()) {
      return false;
    }
    console.log(`finish task ${i}`);
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
    if (rq.expectNum <= rq.num) {
      continue;
    }
    console.log(`try spawn new creep, body: ${rq.bodyParts} expect: ${rq.expectNum} num: ${rq.num}`);
    const err = mySpawn.spawnCreep(rq.bodyParts).error;
    if (err) {
      console.log(`spawn failed with err ${err}`);
      return false;
    } else {
      rq.num++
    }
  }
  for (const rq of requests) {
    if (rq.expectNum > rq.num) {
      console.log(`spawn failed with err still not match, expect ${rq.expectNum} but current is ${rq.num}`);
      return false;
    }
  }
  console.log(`finish a spawn`);
  return true;
}
