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

    return creepTactic.testing();
}