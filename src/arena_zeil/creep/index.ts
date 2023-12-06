import type { BodyPartConstant } from 'game/constants'
import { ATTACK, CARRY, HEAL, MOVE, RANGED_ATTACK, TOUGH, WORK } from 'game/constants'
import { Creep } from 'game/prototypes'
import { getObjectsByPrototype } from 'game/utils'
import { SafeCreep } from './safeCreep'

export function filterCreepsByKind(creeps: SafeCreep[], kind: BodyPartConstant): SafeCreep[] {
  return creeps.filter(c => c.isMatchKind(kind))
}

export interface CreepsByKind {
  attackers: SafeCreep[]
  healers: SafeCreep[]
  workers: SafeCreep[]
  rangedAttackers: SafeCreep[]
  carriers: SafeCreep[]
  enemies: Creep[]
}

export function getCreepsByKind(): CreepsByKind {
  const creeps = getObjectsByPrototype(Creep).map(c => new SafeCreep(c))
  const myCreeps = creeps.filter(c => c.isMy())
  const enemies = creeps.filter(c => !c.isMy())
  return {
    attackers: filterCreepsByKind(myCreeps, ATTACK),
    healers: filterCreepsByKind(myCreeps, HEAL),
    workers: filterCreepsByKind(myCreeps, WORK),
    rangedAttackers: filterCreepsByKind(myCreeps, RANGED_ATTACK),
    carriers: filterCreepsByKind(myCreeps, CARRY),
    enemies: enemies.map(e => e.creep),
  }
}

export function logCreeps() {
  const { workers, attackers, rangedAttackers, healers, enemies } = getCreepsByKind()

  console.log(`
attackers: ${attackers.length}
workers: ${workers.length}
rangedAttackers: ${rangedAttackers.length}
healers: ${healers.length}
enemies: ${enemies.length}
`)
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
    return this.bodyParts
  }
}
