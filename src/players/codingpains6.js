var utils = require('./../lib/utils');
var logic = require('./../lib/codingpains-logic');

var codingpains = {
  info: {
    name: 'Codingpains',
    style: 0
  },

  ai: function(player, enemies, map) {
    // if (canDie(player, enemies)) return codingpains._eluder(player, enemies, map);
    if (player.ammo) return codingpains._hunter(player, enemies, map);
    return codingpains._gatherer(player, enemies, map);
  },

  _gatherer : function(player, enemies, map) {
    var ammoMove;
    var safestMove;
    var centerMove;

    codingpains.info.name = 'Gus 6 - gather';
    if (!map.ammoPosition.length) {
      centerMove = logic.goToCenter(player, map);
      if (logic.isMovementSafe(centerMove, player, enemies, map)) return centerMove;
    } else {
      ammoMove = logic.shouldMoveForAmmo(player, enemies, map);
      if (ammoMove && logic.isMovementSafe(ammoMove, player, enemies, map)) return ammoMove;

      centerMove = logic.goToCenter(player, map);
      if (logic.isMovementSafe(centerMove, player, enemies, map)) return centerMove;
    }

    safestMove = logic.getSafestMove(player, enemies, map);
    if (safestMove) return safestMove;

    return utils.safeRandomMove();
  },

  _hunter : function(player, enemies, map) {
    var turnMove;
    var ammoMove;
    var chaseMove;
    var safestMove;

    codingpains.info.name = "Gus 6 - hunt";
    if (utils.canKill(player, enemies)) return 'shoot';

    turnMove = logic.turnToKill(player, enemies);
    if (turnMove && logic.isMovementSafe(turnMove, player, enemies, map)) return turnMove;

    chaseMove = logic.chaseEnemy(player, enemies, map);
    if (chaseMove && logic.isMovementSafe(chaseMove, player, enemies, map)) return chaseMove;

    safestMove = logic.getSafestMove(player, enemies, map);
    if (safestMove) return safestMove;

    return false;
  },

  _eluder : function(player, enemies, map) {
    codingpains.info.name = "Gus 6 - eluder";
    var killers = logic.getImmediateThreats(player, enemies);

    if (logic.canKillAll(player, killers)) {
      return 'shoot';
    } else if (logic.isMovementSafe('move', player, killers, map)) {
      return 'move';
    } else {
      // Here I would activate a shield!, for now just die :(
      return false;
    }
  }
};

module.exports = codingpains;
