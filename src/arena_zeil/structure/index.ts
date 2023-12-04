import { StructureContainer, StructureSpawn, StructureTower } from "game/prototypes";
import { getObjectsByPrototype } from "game/utils";

export interface StructureByKind {
  containers: StructureContainer[]
  towers: StructureTower[]
  spawners: StructureSpawn[]
}

export function getStructureByKind(): StructureByKind {
  const containers = getObjectsByPrototype(StructureContainer)
  const towers = getObjectsByPrototype(StructureTower)
  const spawners = getObjectsByPrototype(StructureSpawn)
  return {
    containers,
    towers,
    spawners,
  }
}

