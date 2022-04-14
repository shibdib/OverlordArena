'use strict'

import {captureTheFlagTowers} from '../tactics/towerTactics.mjs';
import * as util from '/game/utils';
import * as prototype from '/game/prototypes';
import * as arena from '/arena/prototypes';
import * as constants from '/game/constants';
import * as creepPrototypes from '../tactics/creepTactics.mjs'

let flagLocation;
export function captureTheFlag() {
    // Find creeps/flags/towers
    let myCreeps = util.getObjectsByPrototype(prototype.Creep).filter(object => object.my);
    let enemyCreeps = util.getObjectsByPrototype(prototype.Creep).filter(object => !object.my);
    let myFlag = util.getObjectsByPrototype(arena.Flag).filter(object => object.my)[0];
    let enemyFlag = util.getObjectsByPrototype(arena.Flag).filter(object => !object.my)[0];
    let myTowers = util.getObjectsByPrototype(prototype.StructureTower).filter(object => object.my);
    let enemyTowers = util.getObjectsByPrototype(prototype.StructureTower).filter(object => !object.my);

    // Set flag location
    if (!flagLocation) {
        if (myFlag.x === 3) flagLocation = 'a'; else flagLocation = 'b';
    }

    // Determine phase
    phaseSelection(myCreeps, enemyCreeps, myFlag, enemyFlag, myTowers, enemyTowers);

    // Manage towers
    captureTheFlagTowers(myCreeps, enemyCreeps, myFlag, enemyFlag, myTowers, enemyTowers);

    // Establish teams
    setFireTeams(myCreeps);

    // Team control
    teamTactics(myCreeps, enemyCreeps, myFlag, enemyFlag, myTowers, enemyTowers);

    // Body Building
    bodyBuilding(myCreeps, enemyCreeps);
}

let phaseLocations = {
    0: {
        'a': [{x: 22, y: 53}, {x: 53, y: 22}],
        'b': [{x: 46, y: 76}, {x: 76, y: 46}]
    },
    1: {
        'a': [{x: 9, y: 9}, {x: 9, y: 9}],
        'b': [{x: 90, y: 90}, {x: 90, y: 90}]
    },
    2: {
        'a': [{x: 59, y: 59}, {x: 39, y: 39}],
        'b': [{x: 39, y: 39}, {x: 59, y: 59}]
    },
    3: {
        'a': [{x: 46, y: 76}, {x: 76, y: 46}],
        'b': [{x: 22, y: 53}, {x: 53, y: 22}]
    },
    4: {
        'a': [{x: 96, y: 96}, {x: 96, y: 96}],
        'b': [{x: 3, y: 3}, {x: 3, y: 3}]
    },
    5: {
        'a': [{x: 3, y: 3}, {x: 3, y: 3}],
        'b': [{x: 96, y: 96}, {x: 96, y: 96}]
    },
    6: {
        'a': [{x: 3, y: 3}, {x: 91, y: 91}],
        'b': [{x: 96, y: 96}, {x: 8, y: 8}]
    }
}

/**
 *  Round Phases
 *  0 - Initial defense (stay on our side for tower support and take parts in range)
 *  1 - Full mass defense (fall back to base)
 *  2 - 1 probe 1 defend (1 team will probe one will stay behind and take parts in range)
 *  3 - 2 pronged probe (both teams probe)
 *  4 - Full mass attack (swarm the flag)
 *  5 - DEFEND THE FLAG
 *  6 - 1 Team flag attack
 */

let lastPhaseCheck = 45;
let roundPhase = 0;

function phaseSelection(myCreeps, enemyCreeps, myFlag, enemyFlag, myTowers, enemyTowers) {
    let teamOne = myCreeps.filter((c) => c.team === 1);
    let teamTwo = myCreeps.filter((c) => c.team === 2);
    // DEFEND THE FLAG!
    let highThreat = myFlag.findInRange(enemyCreeps, 6);
    if (highThreat.length) {
        if (roundPhase !== 5) console.log('TACTIC SWITCH: FLAG DEFENSE!');
        return roundPhase = 5;
    }
    // Full defense if... Badly outnumbered, enemy rushing
    let attackingEnemies = myFlag.findInRange(enemyCreeps, 30);
    let turtlingEnemies = enemyFlag.findInRange(enemyCreeps, 30);
    let overwhelmed;
    // Only check for overwhelmed if not attacking the flag already
    if (![1, 4, 5, 6].includes(roundPhase)) {
        if (teamOne.length && teamOne[0].guardSpot) overwhelmed = teamOne.length * 0.9 < util.findInRange(teamOne[0].guardSpot, enemyCreeps, 20).length;
        if (teamTwo.length && teamTwo[0].guardSpot && !overwhelmed) overwhelmed = teamTwo.length * 0.9 < util.findInRange(teamTwo[0].guardSpot, enemyCreeps, 20).length;
    }
    if (myCreeps.length < enemyCreeps.length * 0.7 || attackingEnemies.length > 4 || overwhelmed || highThreat.length > 1) {
        if (roundPhase !== 1) console.log('TACTIC SWITCH: Mass Defense');
        return roundPhase = 1;
    }
    if (lastPhaseCheck && lastPhaseCheck + 25 > util.getTicks()) return;
    lastPhaseCheck = util.getTicks();
    // Mass attack if... Enemy is dead/close to dead or time is about to end
    if (!enemyCreeps.length || enemyCreeps.length <= 3 || util.getTicks() > 1900) {
        if (roundPhase !== 4) console.log('TACTIC SWITCH: Flag Rush');
        return roundPhase = 4;
    }
    // 1 attack 1 defend if... round is close to ending and teams are relatively close
    if (enemyCreeps.length <= myCreeps.length * 0.8 && util.getTicks() > 1750) {
        if (roundPhase !== 6) console.log('TACTIC SWITCH: 1 Attack 1 Defend');
        return roundPhase = 6;
    }
    // 2 attack if... Enemy is weak or turtling and time running down
    if (enemyCreeps.length < myCreeps.length * 0.5 || (util.getTicks() > 1300 && turtlingEnemies.length >= enemyCreeps.length * 0.8)) {
        if (roundPhase !== 3) console.log('TACTIC SWITCH: 2 Prong Probe');
        return roundPhase = 3;
    }
    // 1 attack 1 defense if... Enemy turtling
    if (turtlingEnemies.length >= enemyCreeps.length * 0.8) {
        if (roundPhase !== 2) console.log('TACTIC SWITCH: 1 Probe 1 Defense');
        return roundPhase = 2;
    }
    if (roundPhase !== 0) console.log('TACTIC SWITCH: Basic Defense');
    return roundPhase = 0;
}

function teamTactics(myCreeps, enemyCreeps, myFlag, enemyFlag, myTowers, enemyTowers) {
    let teamOne = myCreeps.filter((c) => c.team === 1);
    let teamTwo = myCreeps.filter((c) => c.team === 2);
    let healers = myCreeps.filter((c) => c.buddy);
    if (!teamOne.length || !teamTwo.length) {
        myCreeps.forEach((c) => c.team = 1);
    }
    // Team 1
    teamOne.forEach(function (c) {
        c.guardLocation(phaseLocations[roundPhase][flagLocation][0], 8);
        c.attackInRange();
        c.healInRange();
    });
    // Team 2
    teamTwo.forEach(function (c) {
        c.guardLocation(phaseLocations[roundPhase][flagLocation][1], 8);
        c.attackInRange();
        c.healInRange();
    });
    // Healers
    healers.forEach(function (c) {
        c.healInRange();
        let kiteAway = enemyCreeps.filter((e) => e.body.some((b) => (b.type === constants.ATTACK || b.type === constants.RANGED_ATTACK) && b.hits > 0) && c.getRangeTo(e) < 3);
        if (kiteAway.length) c.moveTo(kiteAway, {
            flee: true,
            range: 5
        }); else if (util.getObjectById(c.buddy)) c.moveTo(util.getObjectById(c.buddy)); else c.moveTo(myFlag, {range: 0});
    });
    // Retreat if needed
    let crippled = myCreeps.filter((c) => !c.body.some((b) => (b.type === constants.RANGED_ATTACK || b.type === constants.ATTACK || b.type === constants.HEAL) && b.hits > 0));
    crippled.forEach((c) => c.moveTo(myFlag));
}

// Handle body part pickup, do not do it if in mass defense or mass attack
function bodyBuilding(myCreeps, enemyCreeps) {
    if ([1, 4, 5, 6].includes(roundPhase)) return;
    // Find unassigned
    let parts = util.getObjectsByPrototype(arena.BodyPart).filter((p) => !myCreeps.filter((c) => c.partPickup === p.id)[0]);
    if (parts.length) {
        let eligible = myCreeps.filter((c) => c.body.some((b) => b.type === constants.RANGED_ATTACK || b.type === constants.ATTACK) && !util.getObjectById(c.partPickup))
        let moveParts = parts.filter((p) => p.type === constants.MOVE);
        if (moveParts.length) {
            let needsMove = eligible.filter((c) => c.body.filter((b) => b === constants.MOVE).length <= c.body.filter((b) => b !== constants.MOVE).length);
            if (needsMove.length) {
                let closest = moveParts[0].findClosestByPath(needsMove);
                closest.partPickup = moveParts[0].id;
            }
        }
        let upgradeParts = parts.filter((p) => p.type !== constants.MOVE);
        if (upgradeParts.length) {
            let part = upgradeParts[Math.floor(Math.random() * upgradeParts.length)];
            let upgradeable = eligible.filter((c) => c.body.filter((b) => b.type === constants.MOVE).length > c.body.filter((b) => b.type !== constants.MOVE).length);
            if (upgradeable.length) {
                // Rangers get ranged and heals, melee get attack
                if (part.type === constants.ATTACK) upgradeable = upgradeable.filter((c) => c.body.some((b) => b.type === constants.ATTACK));
                let closest = part.findClosestByPath(upgradeable);
                if (closest) closest.partPickup = part.id;
            }
        }
    }
    // Send creeps to pickup
    let bodyBuilding = myCreeps.filter((c) => c.partPickup);
    for (let creep of bodyBuilding) {
        let part = util.getObjectById(creep.partPickup);
        if (!part) {
            creep.partPickup = undefined;
            continue;
        }
        let nearbyEnemy = part.findInRange(enemyCreeps, 4);
        if (nearbyEnemy.length && creep.getRangeTo(part) >= 4) {
            creep.partPickup = undefined;
        } else creep.moveTo(part, {range: 0});
    }
}

// Set up the 2 fire teams for the crossing, recheck every 50 ticks
let teamsSet, noTeamReset;

function setFireTeams(myCreeps) {
    if ((teamsSet && teamsSet + 50 > util.getTicks()) || noTeamReset) return;
    teamsSet = util.getTicks();
    let teamOne = myCreeps.filter((c) => c.team === 1);
    let teamTwo = myCreeps.filter((c) => c.team === 2);
    // If teams are set and have the same number return
    if (teamOne.length && teamTwo.length && teamOne.length === teamTwo.length) return;
    let rangers = myCreeps.filter((c) => c.body.some((b) => b.type === constants.RANGED_ATTACK && b.type !== constants.ATTACK));
    let melee = myCreeps.filter((c) => c.body.some((b) => b.type === constants.ATTACK));
    let healers = myCreeps.filter((c) => c.body.some((b) => b.type === constants.HEAL && b.type !== constants.ATTACK && b.type !== constants.RANGED_ATTACK) && !util.getObjectById(c.buddy));
    // Handle set
    // Split rangers
    let teamNumber = 1;
    for (let i = 0; i < rangers.length; i++) {
        if (i + 1 > rangers.length * 0.5) teamNumber = 2
        rangers[i].team = teamNumber;
    }
    // Split melee
    teamNumber = 1;
    for (let i = 0; i < melee.length; i++) {
        if (i + 1 > melee.length * 0.5) teamNumber = 2;
        melee[i].team = teamNumber;
    }
    // Healers are assigned to attackers
    for (let healer of healers) {
        let buddy = myCreeps.find((c) => c.body.some((b) => b.type === constants.RANGED_ATTACK && b.type !== constants.ATTACK) && !util.getObjectById(c.healer)) || myCreeps.find((c) => c.body.some((b) => b.type === constants.ATTACK) && !util.getObjectById(c.healer)) || myCreeps.find((c) => !c.body.some((b) => b.type === constants.HEAL));
        buddy.healer = healer.id;
        healer.buddy = buddy.id;
    }
}