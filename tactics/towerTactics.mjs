'use strict'

import * as constants from '/game/constants';

export function captureTheFlagTowers(myCreeps, enemyCreeps, myFlag, enemyFlag, myTowers, enemyTowers) {
    for (let tower of myTowers) {
        // Skip if below minimum or on cooldown
        if (tower.store.energy < constants.TOWER_ENERGY_COST) continue;

        // Filter range
        myCreeps = myCreeps.filter((c) => tower.getRangeTo(c) <= constants.TOWER_RANGE);
        enemyCreeps = enemyCreeps.filter((c) => tower.getRangeTo(c) <= constants.TOWER_RANGE);

        // Handle low energy, only defend against high threats unless everyone is far away
        let threateningEnemies = myFlag.findInRange(enemyCreeps, 4);
        if (tower.store.energy < constants.TOWER_ENERGY_COST * 2) {
            if (threateningEnemies.length) {
                tower.attack(myFlag.findClosestByPath(threateningEnemies));
            } else if (myFlag.findInRange(enemyCreeps, constants.TOWER_RANGE * 0.5).length) {
                return;
            }
        }

        // Always Defend
        if (threateningEnemies.length) tower.attack(myFlag.findClosestByPath(threateningEnemies));

        // Headshot when possible
        let killableEnemy = enemyCreeps.find((c) => c.hits < determineDamage(tower.getRangeTo(c)));
        if (killableEnemy) return tower.attack(killableEnemy);

        // Heal if needed
        let wounded = myCreeps.filter((c) => c.hits < c.hitsMax);
        if (wounded.length) return tower.heal(tower.findClosestByRange(wounded));

        // Attack vulnerable
        let noHealers = enemyCreeps.filter((c) => !c.findInRange(enemyCreeps.filter((e) => e.body.some((b) => b.type === HEAL), 3)).length);
        if (noHealers.length) return tower.attack(tower.findClosestByRange(noHealers));

        // Can damage
        /**
        let damageable = enemyCreeps.filter((c) => !c.findInRange(c, enemyCreeps.filter((e) => !e.body.includes('HEAL')), 3)[0]);
        if (damageable.length) return tower.attack(tower.findClosestByRange(damageable));**/
    }
}

// Computes damage base on range
function determineDamage(range) {
    if (range <= constants.TOWER_OPTIMAL_RANGE) {
        return constants.TOWER_POWER_ATTACK;
    } else if (range < constants.TOWER_FALLOFF_RANGE) {
        return constants.TOWER_POWER_ATTACK - 37.5 * (range - 5) / 15;
    } else {
        return 37.5;
    }
}