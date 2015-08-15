var utils = require('../lib/utils.js');
var DIRECTIONS = ['north', 'east', 'south', 'west'];

var canDie = function(player, enemies) {
  return enemies
    .filter((enemy) => enemy.isAlive)
    .map((enemy) => utils.canKill(enemy, [player], enemy.direction))
    .filter((result) => result === true).length > 0;
};

var getClosestAmmo = function(player, map) {
  if (!map.ammoPosition.length) {
    return;
  }
  var playerPos = player.position;
  var closestAmmo = map.ammoPosition[0];

  map.ammoPosition.forEach(function(pos) {
    var isCloser = utils.getDistance(playerPos, pos) < utils.getDistance(playerPos, closestAmmo)
    if (isCloser) {
      closestAmmo = pos;
    }
  });

  return closestAmmo;
};

var shouldMoveForAmmo = function(player, map) {
  var closest = getClosestAmmo(player, map);
  var direction;

  if (!closest) {
    return;
  }

  direction = utils.fastGetDirection(player.position, closest);

  if (direction !== player.direction) {
    return direction;
  }

  return 'move';
};

var isMovementSafe = function(action, player, enemies, map) {
  var futureState = JSON.parse(JSON.stringify(player));

  if (action === 'move') {
    switch (player.direction) {
      case DIRECTIONS[0]:
        if (futureState.position[0] > 0) {
          futureState.position[0]--;
        }
        break;
      case DIRECTIONS[1]:
        console.log(map.gridSize);
        if (futureState.position[1] < map.gridSize[1]) {
          futureState.position[1]++;
        }
        break;
      case DIRECTIONS[2]:
        if (futureState.position[0] < map.gridSize[0]) futureState.position[0]++;
        break;
      case DIRECTIONS[3]:
        if (futureState[1] > 0) futureState.position[1]--;
        break;
      default:
        break;
    }
  }

  if (canDie(futureState, enemies)) {
    console.error("So fucking unsafe!");
    return false;
  }
  return true;
};

var getSafestMove = function(player, enemies, map) {
  var safest;
  var isSafeHere = isMovementSafe('north', player, enemies, map);
  var isSafeToMove = isMovementSafe('move', player, enemies, map);

  if (isSafeHere) {
    if (player.ammo) {
      return turnToKill(player, enemies) || chaseEnemy(player, enemies);
    }
  }
  if (isSafeToMove) {
    return 'move';
  }

  return;
};

var getClosestEnemy = function(player, enemies) {
  var clonedStates = enemies.slice(0, enemies.length);
  var closest;

  clonedStates = clonedStates.filter(function(enemy) {
    return enemy.isAlive;
  });

  closest = clonedStates[0];

  clonedStates.forEach(function(enemy) {
    if (utils.getDistance(player, enemy) < utils.getDistance(player, closest)) {
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

var turnToKill = function(player, enemies) {
  var turn = false;
  var mockState = JSON.parse(JSON.stringify(player));

  enemies = enemies.filter(function(enemy) {
    return enemy.isAlive;
  });

  DIRECTIONS.forEach(function(direction) {
    mockState.direction = direction;

    if (utils.canKill(mockState, enemies)) {
      turn = direction;
    }
  });

  return turn;
};

var hunter = function(player, enemies, map) {
  var turnMove;
  var ammoMove;
  var chaseMove;
  var safestMove;

  codingpains.info.name = "Gus 4";
  if (utils.canKill(player, enemies)) return 'shoot';

  turnMove = turnToKill(player, enemies);
  if (turnMove && isMovementSafe(turnMove, player, enemies, map)) return turnMove;

  chaseMove = chaseEnemy(player, enemies);
  if (chaseMove && isMovementSafe(chaseMove, player, enemies, map)) return chaseMove;

  safestMove = getSafestMove(player, enemies, map);
  if (safestMove) return safestMove;

  return utils.safeRandomMove();
};

var gatherer = function(player, enemies, map) {
  var ammoMove;
  var safestMove;
  codingpains.info.name = 'Gus 4';

  ammoMove = shouldMoveForAmmo(player, map);
  if (ammoMove && isMovementSafe(ammoMove, player, enemies, map)) return ammoMove;

  safestMove = getSafestMove(player, enemies, map);
  if (safestMove) return safestMove;

  return utils.safeRandomMove();
};

var kills = 0;

var codingpains = {
  info: {
    name: 'Codingpains',
    style: 0
  },
  ai: function(player, enemies, map) {
    if (player.ammo) return hunter(player, enemies, map);
    return gatherer(player, enemies, map);
  }
};

module.exports = codingpains;
