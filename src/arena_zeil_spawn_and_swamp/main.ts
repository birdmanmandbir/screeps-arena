import { BodyPartConstant, RESOURCE_ENERGY } from "game/constants";
import { Creep, RoomPosition, Structure, StructureConstant, StructureContainer, StructureSpawn } from "game/prototypes";
import { findInRange, getObjectsByPrototype, getTicks } from "game/utils";
import { BodyBuilder, getCreepsByUser, logCreeps } from "./creep";
import { SafeCreep, mapSafeCreep2Creep } from "./creep/safeCreep";
import { getStructureByKind } from "./structure";

const rangedAttackerBody = new BodyBuilder().rangedAttack(3).tough(0).move(2).build();
const attackerBody = new BodyBuilder().attack(3).tough(0).move(2).build();
const carrierBody = new BodyBuilder().carry(2).move(2).build();
const healerBody = new BodyBuilder().heal(1).move(2).build();
const workerBody = new BodyBuilder().work(2).carry(2).move().build();

const rangedAttackerExpectNum = 10;
const attackerExpectNum = 8;
const carrierExpectNum = 3;
const healerExpectNum = 1;
const workerExpectNum = 1;

enum BattleStage {
  SpawnWorker,
  SpawnArmy,
  Defense,
  Attack,
  AttackBase
}

let stage = BattleStage.SpawnWorker;

let mySpawn: StructureSpawn;
let enemySpawn: StructureSpawn;
let collectPoint: RoomPosition;
// Global store
function init() {
  const { spawners } = getStructureByKind();
  mySpawn = spawners.find(s => s.my) as StructureSpawn;
  enemySpawn = spawners.find(s => !s.my) as StructureSpawn;
  collectPoint = {
    x: mySpawn.x,
    y: 10
  };
}

export function loop(): void {
  logCreeps();
  // console.log(`current stage: ${stage}`)
  if (getTicks() === 1) {
    init();
  }
  const { my, enemy } = getCreepsByUser();
  const { carriers, attackers, rangedAttackers, healers } = my;
  const { creeps: enemies } = enemy;

  const allKindAttackers = [...attackers, ...rangedAttackers];

  switch (stage) {
    case BattleStage.SpawnWorker:
      if (
        doSpawnRequests(mySpawn, [
          {
            bodyParts: carrierBody,
            num: carriers.length,
            expectNum: carrierExpectNum
          }
        ])
      ) {
        stage = BattleStage.SpawnArmy;
      }
      break;
    case BattleStage.SpawnArmy:
      collectArmy([...allKindAttackers, ...healers]);
      if (
        doSpawnRequests(mySpawn, [
          {
            bodyParts: attackerBody,
            num: attackers.length,
            expectNum: attackerExpectNum
          },
          {
            bodyParts: rangedAttackerBody,
            num: rangedAttackers.length,
            expectNum: rangedAttackerExpectNum
          },
          {
            bodyParts: healerBody,
            num: healers.length,
            expectNum: healerExpectNum
          }
        ]) &&
        collectArmy([...allKindAttackers, ...healers])
      ) {
        stage = BattleStage.Attack;
      }
      if (needDefense(mySpawn, enemies)) {
        stage = BattleStage.Defense;
      }
      break;
    case BattleStage.Defense:
      doDefense(allKindAttackers, enemies);
      moveHealersToAttackers(healers, allKindAttackers);
      doHeal(healers, allKindAttackers);
      if (!needDefense(mySpawn, enemies)) {
        stage = BattleStage.Attack;
      }
      break;
    case BattleStage.Attack:
      doAttack(allKindAttackers, enemies);
      moveHealersToAttackers(healers, allKindAttackers);
      doHeal(healers, allKindAttackers);
      if (needDefense(mySpawn, enemies)) {
        stage = BattleStage.Defense;
      }
      if (needAttackBase(enemySpawn, enemies)) {
        stage = BattleStage.AttackBase;
      }
      break;
    case BattleStage.AttackBase:
      doAttack(allKindAttackers, enemySpawn);
      moveHealersToAttackers(healers, allKindAttackers);
      doHeal(healers, allKindAttackers);
      if (needDefense(mySpawn, enemies)) {
        stage = BattleStage.Defense;
      }
    default:
      break;
  }
  runWorkers(carriers, mySpawn);
}

function needDefense(mySpawn: StructureSpawn, enemies: Creep[]): boolean {
  const defenseRange = 40;
  return findInRange(mySpawn, enemies, defenseRange).length !== 0;
}

function needAttackBase(enemySpawn: StructureSpawn, enemies: Creep[]): boolean {
  const attackCreepRange = 28;
  return findInRange(enemySpawn, enemies, attackCreepRange).length === 0;
}

function runWorkers(workers: SafeCreep[], mySpawn: StructureSpawn) {
  const containers = getObjectsByPrototype(StructureContainer);
  const myContainers = findInRange(mySpawn, containers, 10);
  for (let i = 0; i < workers.length; i++) {
    const containerId = i % containers.length;
    const err = workers[i].harvestOrTransfer(myContainers[containerId], mySpawn, RESOURCE_ENERGY);
    console.log(`harvestOrTransfer failed for ${err}`);
  }
}

function collectArmy(members: SafeCreep[]): boolean {
  for (const a of members) {
    a.creep.moveTo(collectPoint);
  }
  const collectRange = 5;
  return findInRange(collectPoint, members.map(mapSafeCreep2Creep), collectRange).length === members.length;
}

function doAttack(attackers: SafeCreep[], enemies: Creep[] | Structure<StructureConstant>) {
  for (const a of attackers) {
    a.autoAttack(enemies);
  }
}

function doDefense(attackers: SafeCreep[], enemies: Creep[]) {
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
      rq.num++;
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
