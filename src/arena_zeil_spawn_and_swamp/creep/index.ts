import type { BodyPartConstant } from 'game/constants'
import { ATTACK, CARRY, HEAL, MOVE, RANGED_ATTACK, TOUGH, WORK } from 'game/constants'
import { Creep } from 'game/prototypes'
import { getObjectsByPrototype } from 'game/utils'
import type { SafeCreep } from './safeCreep'
import { mapCreep2SafeCreep, mapSafeCreep2Creep } from './safeCreep'

export function filterCreepsByKind(creeps: SafeCreep[], kind: BodyPartConstant): SafeCreep[] {
  return creeps.filter(c => c.isMatchKind(kind))
}

export interface CreepsByKind {
  attackers: SafeCreep[]
  rangedAttackers: SafeCreep[]
  healers: SafeCreep[]
  workers: SafeCreep[]
  carriers: SafeCreep[]
  creeps: Creep[]
}

export interface CreepsByUser {
  my: CreepsByKind
  enemy: CreepsByKind
}

function getCreepsByKind(creeps: SafeCreep[]): CreepsByKind {
  return {
    attackers: filterCreepsByKind(creeps, ATTACK),
    healers: filterCreepsByKind(creeps, HEAL),
    workers: filterCreepsByKind(creeps, WORK),
    rangedAttackers: filterCreepsByKind(creeps, RANGED_ATTACK),
    carriers: filterCreepsByKind(creeps, CARRY),
    creeps: creeps.map(mapSafeCreep2Creep),
  }
}

export function getCreepsByUser(): CreepsByUser {
  const creeps = getObjectsByPrototype(Creep).map(mapCreep2SafeCreep)
  const myCreeps = creeps.filter(c => c.isMy())
  const enemies = creeps.filter(c => !c.isMy())
  return {
    my: getCreepsByKind(myCreeps),
    enemy: getCreepsByKind(enemies),
  }
}

function strCreepsByKind(cbk: CreepsByKind): string {
  return `
total: ${cbk.creeps.length}
army: ${[...cbk.attackers, ...cbk.rangedAttackers, ...cbk.healers].length}
[${cbk.attackers.length} A ${cbk.rangedAttackers.length} RA ${cbk.healers.length} H]
`
}

export function logCreeps() {
  const { my, enemy } = getCreepsByUser()
  console.log(`my statistic`)
  console.log(strCreepsByKind(my))
  console.log(`enemy statistic`)
  console.log(strCreepsByKind(enemy))
}

export class BodyBuilder {
  bodyParts: BodyPartConstant[] = []
  constructor() {}

  put(kind: BodyPartConstant, num = 1) {
    for (let i = 0; i < num; i++)
      this.bodyParts.push(kind)
  }

  attack(num = 1): BodyBuilder {
    this.put(ATTACK, num)
    return this
  }

  carry(num = 1): BodyBuilder {
    this.put(CARRY, num)
    return this
  }

  rangedAttack(num = 1): BodyBuilder {
    this.put(RANGED_ATTACK, num)
    return this
  }

  heal(num = 1): BodyBuilder {
    this.put(HEAL, num)
    return this
  }

  work(num = 1): BodyBuilder {
    this.put(WORK, num)
    return this
  }

  tough(num = 1): BodyBuilder {
    this.put(TOUGH, num)
    return this
  }

  move(ratio = 1.0): BodyBuilder {
    const currentPartNum = this.bodyParts.length
    const moveNum = Math.ceil(currentPartNum * ratio)
    this.put(MOVE, moveNum)
    return this
  }

  build(): BodyPartConstant[] {
    // make move to start, so the central body part will not be destruct before the move
    return this.bodyParts.reverse()
  }
}
