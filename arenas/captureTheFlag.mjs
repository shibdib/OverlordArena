'use strict'

import * as creepTactic from '../tactics/creepTactics.mjs';
import { captureTheFlagTowers } from '../tactics/towerTactics.mjs';
import * as util from '/game/utils';
import * as prototype from '/game/prototypes';
import * as arena from '/arena/prototypes';

export function captureTheFlag() {
    // Find creeps/flags/towers
    let myCreeps = util.getObjectsByPrototype(prototype.Creep).filter(object => object.my);
    let enemyCreeps = util.getObjectsByPrototype(prototype.Creep).filter(object => !object.my);
    let myFlag = util.getObjectsByPrototype(arena.Flag).filter(object => object.my)[0];
    let enemyFlag = util.getObjectsByPrototype(arena.Flag).filter(object => !object.my)[0];
    let myTowers = util.getObjectsByPrototype(prototype.StructureTower).filter(object => object.my);
    let enemyTowers = util.getObjectsByPrototype(prototype.StructureTower).filter(object => !object.my);

    // Manage towers
    captureTheFlagTowers(myCreeps, enemyCreeps, myFlag, enemyFlag, myTowers, enemyTowers);

    // Establish pairs
    pairUp(myCreeps);

    return creepTactic.testing();
}

function pairUp(creeps) {
    let unassignedHealers = creeps.filter((c) => c.body.some((b) => b.type === HEAL) && (!c.assignedRanger || !util.getObjectById(c.assignedRanger)));
    let lonelyRangers = creeps.filter((c) => c.body.some((b) => b.type === RANGED_ATTACK) && !c.assignedHealer || !util.getObjectById(c.assignedHealer));
    // Healers find rangers
    if (unassignedHealers.length) {

    } else
    // Orphan rangers look for already assigned healers to tag with
    if (lonelyRangers.length) {
        let closestHealer = creeps.filter((c) => c.body.some((b) => b.type === HEAL));
    }
}