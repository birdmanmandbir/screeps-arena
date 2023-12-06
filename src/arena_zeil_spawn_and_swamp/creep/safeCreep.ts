import { ScoreCollector } from "arena/prototypes";
import {
  ATTACK,
  BodyPartConstant,
  CreepActionReturnCode,
  ERR_NOT_IN_RANGE,
  OK,
  RANGED_ATTACK,
  ResourceConstant,
  ScreepsReturnCode
} from "game/constants";
import { Creep, Source, Structure, StructureConstant, StructureContainer } from "game/prototypes";
import { findInRange } from "game/utils";

export function mapCreep2SafeCreep(creep: Creep): SafeCreep {
  return new SafeCreep(creep);
}

export function mapSafeCreep2Creep(sc: SafeCreep): Creep {
  return sc.creep
}

// + auto move
// + help filter
export class SafeCreep {
  creep: Creep;
  constructor(creep: Creep) {
    this.creep = creep;
  }

  attack(target: Creep | Structure<StructureConstant>): CreepActionReturnCode {
    const err = this.creep.attack(target);
    if (err === ERR_NOT_IN_RANGE) {
      this.creep.moveTo(target);
    }
    return err;
  }

  rangedAttack(target: Creep | Structure<StructureConstant>): CreepActionReturnCode {
    const err = this.creep.rangedAttack(target);
    if (err === ERR_NOT_IN_RANGE) {
      this.creep.moveTo(target);
    }
    return err;
  }

  selectTarget(targets: Creep[]): Creep | null {
    if (targets.length === 0) {
      return null
    }
    const accurateSelectRange = 30
    if (this.creep.findInRange(targets, accurateSelectRange).length === 0) {
      return targets[0]
    }
    return this.creep.findClosestByPath(targets);
  }

  autoAttack(targetsOrStructure: Creep[] | Structure<StructureConstant>) {
    let target: Creep | Structure<StructureConstant> | null;
    if (Array.isArray(targetsOrStructure)) {
      target = this.selectTarget(targetsOrStructure)
      if (!target) return;
    } else {
      target = targetsOrStructure
    }
    if (this.isMatchKind(ATTACK)) {
      this.attack(target);
    }
    if (this.isMatchKind(RANGED_ATTACK)) {
      this.rangedAttack(target);
    }
  }

  autoDefense(targets: Creep[], range: number) {
    const targetsInRange = findInRange(this.creep, targets, range);
    if (targetsInRange.length > 0) {
      this.autoAttack(targetsInRange);
    }
  }

  heal(target: Creep): CreepActionReturnCode {
    if (target.hits >= target.hitsMax) {
      return OK;
    }
    const err = this.creep.heal(target);
    if (err === ERR_NOT_IN_RANGE) {
      this.creep.moveTo(target);
    }
    return err;
  }

  autoHeal(targets: SafeCreep[]): CreepActionReturnCode {
    const creepsNeedToHeal = targets.filter(t => !t.isHealthy()).map(c => c.creep);
    const target = this.creep.findClosestByPath(creepsNeedToHeal);
    if (!target) {
      return OK;
    }
    return this.heal(target);
  }

  rangedHeal(target: Creep): CreepActionReturnCode {
    const err = this.creep.rangedHeal(target);
    if (err === ERR_NOT_IN_RANGE) {
      this.creep.moveTo(target);
    }
    return err;
  }

  harvest(target: Source): CreepActionReturnCode | -5 | -6 {
    const err = this.creep.harvest(target);
    if (err === ERR_NOT_IN_RANGE) {
      this.creep.moveTo(target);
    }
    return err;
  }

  transfer(
    target: Creep | Structure<StructureConstant> | ScoreCollector,
    resourceType: ResourceConstant,
    amount?: number | undefined
  ): ScreepsReturnCode {
    const err = this.creep.transfer(target, resourceType, amount);
    if (err === ERR_NOT_IN_RANGE) {
      this.creep.moveTo(target);
    }
    return err;
  }

  // TODO container maybe also need this
  harvestOrTransfer(
    src: Source | StructureContainer,
    dest: Structure<StructureConstant>,
    resourceType: ResourceConstant,
    amount?: number | undefined
  ): ScreepsReturnCode {
    if (this.creep.store.getFreeCapacity(resourceType)) {
      if (src instanceof Source) {
        return this.harvest(src);
      }
      if (src instanceof StructureContainer) {
        return this.withdraw(src, resourceType);
      }
      throw `not implement harvest for this type`;
    } else {
      return this.transfer(dest, resourceType, amount);
    }
  }

  withdraw(
    target: Structure<StructureConstant>,
    resourceType: ResourceConstant,
    amount?: number | undefined
  ): ScreepsReturnCode {
    const err = this.creep.withdraw(target, resourceType, amount);
    if (err === ERR_NOT_IN_RANGE) {
      this.creep.moveTo(target);
    }
    return err;
  }

  isHealthy(): boolean {
    return this.creep.hits === this.creep.hitsMax;
  }

  isMatchKind(kind: BodyPartConstant): boolean {
    return this.creep.body.some(bodyPart => bodyPart.type === kind);
  }

  isMy(): boolean {
    return this.creep.my;
  }
}
