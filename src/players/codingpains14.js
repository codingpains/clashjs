var utils = require('../lib/utils.js');
var DIRECTIONS = ['north', 'east', 'south', 'west'];

var canDie = function(playerState, enemiesStates) {
  return enemiesStates
    .filter((enemy) => enemy.isAlive)
    .map((enemy) => utils.canKill(enemy, [playerState], enemy.direction))
    .filter((result) => result === true).length > 0;
};

var getClosestAmmo = function(playerState, gameEnvironment) {
  if (!gameEnvironment.ammoPosition.length) {
    return;
  }
  var playerPos = playerState.position;
  var closestAmmo = gameEnvironment.ammoPosition[0];

  gameEnvironment.ammoPosition.forEach(function(pos) {
    var isCloser = utils.getDistance(playerPos, pos) < utils.getDistance(playerPos, closestAmmo)
    if (isCloser) {
      closestAmmo = pos;
    }
  });

  return closestAmmo;
};

var shouldMoveForAmmo = function(playerState, gameEnvironment) {
  var closest = getClosestAmmo(playerState, gameEnvironment);
  var direction;

  if (!closest) {
    return;
  }

  direction = utils.fastGetDirection(playerState.position, closest);

  if (direction !== playerState.direction) {
    return direction;
  }

  return 'move';
};

var isMovementSafe = function(action, playerState, enemiesStates) {
  var futureState = JSON.parse(JSON.stringify(playerState));

  if (action === 'move') {
    switch (playerState.direction) {
      case DIRECTIONS[0]:
        futureState.position[0]--;
        break;
      case DIRECTIONS[1]:
        futureState.position[1]++;
        break;
      case DIRECTIONS[2]:
        futureState.position[0]++;
        break;
      case DIRECTIONS[3]:
        futureState.position[1]--;
        break;
      default:
        break;
    }
  }
  if (canDie(futureState, enemiesStates)) {
    console.error("So fucking unsafe!");
    return false;
  }
  return true;
};

var getClosestEnemy = function(playerState, enemiesStates) {
  var clonedStates = enemiesStates.slice(0, enemiesStates.length);
  var closest;

  clonedStates = clonedStates.filter(function(enemy) {
    return enemy.isAlive;
  });

  closest = clonedStates[0];

  clonedStates.forEach(function(enemy) {
    if (utils.getDistance(playerState, enemy) < utils.getDistance(playerState, closest)) {
      closest = enemy;
    }
  });

  return closest;
};

var getBackPosition = function(enemy) {
  var back = enemy.position.slice(0, 2);
  switch (enemy.direction) {
    case 'north':
      back[0]++;
      break;
    case 'south':
      back[0]--;
      break;
    case 'west':
      back[1]++;
      break;
    case 'east':
      back[1]--;
      break;
  }

  return back;
};

var chaseEnemy = function(player, enemies) {
  var closestEnemy = getClosestEnemy(player, enemies);
  var back = getBackPosition(closestEnemy);
  var direction = utils.fastGetDirection(player.position, back);

  if (direction !== player.direction) {
    return direction;
  }

  return 'move';
};

var turnToKill = function(playerState, enemiesStates) {
  var turn = false;
  var mockState = JSON.parse(JSON.stringify(playerState));

  enemiesStates = enemiesStates.filter(function(enemy) {
    return enemy.isAlive;
  });

  DIRECTIONS.forEach(function(direction) {
    mockState.direction = direction;

    if (utils.canKill(mockState, enemiesStates)) {
      turn = direction;
    }
  });

  return turn;
};

var codingpains = {
  info: {
    name: 'Gus 1',
    style: 0
  },
  ai: (playerState, enemiesStates, gameEnvironment) => {
    var turnMovement;
    var ammoMovement;
    var chaseMovement;

    if (playerState.ammo) {
      codingpains.info.name = "Gus 14";
      if (utils.canKill(playerState, enemiesStates)) return 'shoot';

      turnMovement = turnToKill(playerState, enemiesStates);
      if (turnMovement && isMovementSafe(turnMovement, playerState, enemiesStates)) return turnMovement;

      chaseMovement = chaseEnemy(playerState, enemiesStates);
      if (chaseMovement && isMovementSafe(chaseMovement, playerState, enemiesStates)) return chaseMovement;

      ammoMovement = shouldMoveForAmmo(playerState, gameEnvironment);
      if (ammoMovement) return ammoMovement;

      return utils.safeRandomMove();
    }
    codingpains.info.name = "Gus 14";
    ammoMovement = shouldMoveForAmmo(playerState, gameEnvironment);
    if (ammoMovement) return ammoMovement;

    return utils.safeRandomMove();
  }
};

module.exports = codingpains;
