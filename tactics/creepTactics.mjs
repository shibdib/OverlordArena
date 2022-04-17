'use strict'

import * as prototype from '/game/prototypes';
import {Creep} from '/game/prototypes';
import {CostMatrix, searchPath} from '/game/path-finder';
import * as util from '/game/utils';
import * as constants from '/game/constants';

// Guard location (move to location and protect it)
let STUCK_COUNTER = 3;
Creep.prototype.shibMove = function (target, options = {}) {
    // Check if path exists
    if (this.pathInfo && this.pathInfo.path && this.pathInfo.path.length) {
        if (this.pathInfo.target === target.x + '.' + target.y) {
            let nextDirection = parseInt(this.pathInfo.path[0], 10);
            this.move(nextDirection);
            this.pathInfo.path = this.pathInfo.path.slice(1);
            return;
        }
    }
    this.pathInfo = undefined;
    // Create obstacle matrix
    options.costMatrix = new CostMatrix;
    let myCreeps = util.getObjectsByPrototype(Creep).filter(c => c.my);
    let enemyCreeps = util.getObjectsByPrototype(Creep).filter(c => !c.my);
    let structures = util.getObjectsByPrototype(prototype.Structure).filter((s) => constants.OBSTACLE_OBJECT_TYPES.includes(s.structureType));
    let impassible = enemyCreeps.concat(structures);
    if (options.noBump) impassible = impassible.concat(myCreeps);
    impassible.forEach((o) => options.costMatrix.set(o.x, o.y, 255));
    let ret = searchPath(this, target, options);
    if (ret.incomplete) {
        return this.moveTo(target);
    } else {
        this.pathInfo.path = ret.path;
        let nextDirection = parseInt(this.pathInfo.path[0], 10);
        this.pathInfo.target = target.x + '.' + target.y;
        this.pathInfo.newPos = positionAtDirection(origin, nextDirection);
    }
};

// Attack creeps in range
Creep.prototype.attackInRange = function () {
    this.rangedMassAttack();
    let enemyCreeps = util.getObjectsByPrototype(Creep).filter(c => !c.my);
    let enemyTowers = util.getObjectsByPrototype(prototype.StructureTower).filter(object => !object.my);
    if (this.body.some((b) => b.type === constants.ATTACK)) {
        let inRangeEnemies = this.findInRange(enemyCreeps, 1).concat(this.findInRange(enemyTowers, 1));
        if (inRangeEnemies.length) {
            let lowHealth = inRangeEnemies.sort(function (a, b) {
                return a.hits - b.hits;
            })[0];
            this.attack(lowHealth);
            let lowHealthFriends = lowHealth.findInRange(enemyCreeps, 1);
            if (lowHealthFriends.length < 3) this.moveTo(lowHealth, {range: 0});
            {
                this.moveTo(lowHealthFriends, {flee: true, range: 5});
            }
        }
    } else if (this.body.some((b) => b.type === constants.RANGED_ATTACK)) {
        let inRangeEnemies = this.findInRange(enemyCreeps, 3);
        if (inRangeEnemies.length) {
            let lowHealth = inRangeEnemies.sort(function (a, b) {
                return a.hits - b.hits;
            })[0];
            if (inRangeEnemies.length === 1 || lowHealth.hits < lowHealth.hitsMax * 0.15) this.rangedAttack(lowHealth);
            let kiteAway = inRangeEnemies.filter((c) => c.body.some((b) => (b.type === constants.ATTACK || b.type === constants.RANGED_ATTACK) && b.hits > 0) && this.getRangeTo(c) < 3);
            if (kiteAway.length) this.moveTo(kiteAway, {flee: true, range: 5});
        }
    }
};

// Heal creeps in range
Creep.prototype.healInRange = function () {
    if (!this.body.some((b) => b.type === constants.HEAL)) return false;
    let woundedCreeps = this.findInRange(util.getObjectsByPrototype(Creep).filter(c => c.my && c.hits < c.hitsMax), 3);
    if (woundedCreeps.length) {
        let lowestHealth = woundedCreeps.sort(function (a, b) {
            return a.hits - b.hits;
        })[0];
        if (this.getRangeTo(lowestHealth) > 1 || this.body.some((b) => b.type === constants.ATTACK)) this.rangedHeal(lowestHealth); else this.heal(lowestHealth);
    } else if (this.hits < this.hitsMax) this.heal(this); else if (util.getObjectById(this.buddy)) this.heal(util.getObjectById(this.buddy));
};

// Guard location (move to location and protect it)
Creep.prototype.guardLocation = function (location, guardRange = 4) {
    this.guardSpot = location;
    let enemyCreeps = util.findInRange(location, util.getObjectsByPrototype(Creep).filter(c => !c.my), guardRange);
    if (enemyCreeps.length) this.moveTo(util.findClosestByRange(location, enemyCreeps)); else {
        return this.moveTo(location);
    }
};


function positionAtDirection(origin, direction) {
    let offsetX = [0, 0, 1, 1, 1, 0, -1, -1, -1];
    let offsetY = [0, -1, -1, 0, 1, 1, 1, 0, -1];
    let xPos = origin.x + offsetX[direction];
    let yPos = origin.y + offsetY[direction];
    if (xPos > 49 || xPos < 0 || yPos > 49 || yPos < 0 || !xPos || !yPos) {
        return;
    }
    return xPos + '.' + yPos;
}