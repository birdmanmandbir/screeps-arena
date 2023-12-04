import { ATTACK, BodyPartConstant, CARRY, HEAL, RANGED_ATTACK, WORK } from "game/constants";
import { Creep } from "game/prototypes";
import { getObjectsByPrototype } from "game/utils";
import { SafeCreep } from "./safeCreep";

export function filterCreepsByKind(creeps: SafeCreep[], kind: BodyPartConstant): SafeCreep[] {
  return creeps.filter(c => c.isMatchKind(kind));
}

export interface CreepsByKind {
  attackers: SafeCreep[];
  healers: SafeCreep[];
  workers: SafeCreep[];
  rangedAttackers: SafeCreep[];
  carriers: SafeCreep[];
  enemies: SafeCreep[];
}

export function getCreepsByKind(): CreepsByKind {
  const creeps = getObjectsByPrototype(Creep).map(c => new SafeCreep(c));
  const myCreeps = creeps.filter(c => c.isMy());
  const enemies = creeps.filter(c => !c.isMy());
  return {
    attackers: filterCreepsByKind(myCreeps, ATTACK),
    healers: filterCreepsByKind(myCreeps, HEAL),
    workers: filterCreepsByKind(myCreeps, WORK),
    rangedAttackers: filterCreepsByKind(myCreeps, RANGED_ATTACK),
    carriers: filterCreepsByKind(myCreeps, CARRY),
    enemies: enemies
  };
}
