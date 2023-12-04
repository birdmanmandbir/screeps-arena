import { ScoreCollector } from "arena/prototypes";
import { BodyPartConstant, CreepActionReturnCode, ERR_NOT_IN_RANGE, OK, ResourceConstant, ScreepsReturnCode } from "game/constants";
import { Creep, Source, Structure, StructureConstant } from "game/prototypes";

export function creep2SafeCreep(creep: Creep): SafeCreep {
  return new SafeCreep(creep);
}

// + auto move
// + help filter
export class SafeCreep {
  creep: Creep;
  constructor(creep: Creep) {
    this.creep = creep
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

  isMatchKind(kind: BodyPartConstant): boolean {
    return this.creep.body.some(bodyPart => bodyPart.type === kind);
  }

  isMy(): boolean {
    return this.creep.my
  }
}
