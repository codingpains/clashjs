var utils = require('../lib/utils.js');
var DIRECTIONS = ['north', 'east', 'south', 'west'];

var canDie = function(player, enemies) {
  return enemies.map(function(enemy) {
    return enemy.ammo > 0 && utils.isVisible(enemy.position, player.position, enemy.direction)
  }).filter(function(result) {
    return result === true;
  }).length > 0;
};

var getClosestAmmo = function(player, ammoPosition) {
  var closest;

  if (!ammoPosition.length) return;

  closest = ammoPosition[0];

  ammoPosition.forEach(function(ammo) {
    var isCloser = utils.getDistance(player.position, ammo) < utils.getDistance(player.position, closest);
    if (isCloser) {
      closest = ammo;
    }
  });

  return closest;
};

var getReachableAmmo = function(player, enemies, map) {
  var reachable = map.ammoPosition.filter(function(ammo) {
    var distance = utils.getDistance(player.position, ammo);

    return !enemies.some(function(enemy) {
      return utils.getDistance(enemy.position, ammo) < distance
    });
  });

  return reachable;
};

var shouldMoveForAmmo = function(player, enemies, map) {
  var ammo = getReachableAmmo(player, enemies, map);
  var closest;
  var direction;

  if (!ammo.length) return false;

  closest = getClosestAmmo(player, ammo);
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
        if (futureState.position[1] < map.gridSize) {
          futureState.position[1]++;
        }
        break;
      case DIRECTIONS[2]:
        if (futureState.position[0] < map.gridSize) {
          futureState.position[0]++;
        }
        break;
      case DIRECTIONS[3]:
        if (futureState.position[1] > 0) {
          futureState.position[1]--;
        }
        break;
      default:
        break;
    }
  }

  if (canDie(futureState, enemies)) {
    return false;
  } else {
    return true;
  }
};

var getSafestMove = function(player, enemies, map) {
  var safest;
  var isSafeHere = isMovementSafe('north', player, enemies, map);
  var isSafeToMove = isMovementSafe('move', player, enemies, map);

  if (isSafeHere) {
    if (player.ammo) {
      return turnToKill(player, enemies) || chaseEnemy(player, enemies, map);
    }
  }
  if (isSafeToMove) {
    return 'move';
  }

  return;
};

var goToCenter = function(player, map) {
  var center = [map.gridSize,map.gridSize].map((coord) => Math.floor(coord/2));
  var movement = utils.fastGetDirection(player.position, center);

  if (movement === player.direction) {
    movement = 'move';
  }

  return movement;
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

var sneakyGetDirection = function(player, enemy) {
  var diffVertical = Math.abs(player.position[0] - player.position[0]);

  if (diffVertical && enemy.position !== 'north' && enemy.position !== 'south') {
    return (player.position[0] - enemy.position[0] > 0) ? 'north' : 'south';
  }
  return (player.position[1] - enemy.position[1] > 0) ? 'west' : 'east';
};

var verticalDelta = function(start, end) {
  return Math.abs(start[0]-end[0]);
};

var horizontalDelta = function(start, end) {
  return Math.abs(start[1]-end[1]);
};

var isVertical = function(direction) {
  return ['north', 'south'].indexOf(direction) > -1;
};

var isHorizontal = function(direction) {
  return ['west', 'east'].indexOf(direction) > -1;
};

var opositeDirection = function(direction) {
  var ret;
  switch (direction) {
    case 'north':
      ret = 'south';
      break;
    case 'sorth':
      ret = 'north';
      break;
    case 'west':
      ret = 'east';
      break;
    case 'east':
      ret = 'west';
      break;
  }
  return ret;
}

var chaseEnemy = function(player, enemies, map) {
  var closest = getClosestEnemy(player, enemies);
  var back = getBackPosition(closest);
  var direction = sneakyGetDirection(player, closest);

  if (direction !== player.direction) {
    return direction;
  }

  if (!isMovementSafe('move', player, [closest], map)) {
    if (isVertical(player.direction) && horizontalDelta(player.position, closest.position) === 1) return 'hold';
    if (isHorizontal(player.direction) && verticalDelta(player.position, closest.position) === 1) return 'hold';
    return opositeDirection(closest.direction);
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

var canKillAll = function(player, enemies) {
  if (!player.ammo) return false;
  var killable = enemies.filter((enemy) => utils.canKill(player, [enemy]));

  return enemies.length === killable.length;
};

var eluder = function(player, enemies, map) {
  codingpains.info.name = "Gus 6 - eluder";
  var killers = utils.getImmediateThreats(player, enemies);

  if (canKillAll(player, killers)) {
    return 'shoot';
  } else if (isMovementSafe('move', player, killers, map)) {
    return 'move';
  } else {
    // Here I would activate a shield!, for now just die :(
    return false;
  }
};

var hunter = function(player, enemies, map) {
  var turnMove;
  var ammoMove;
  var chaseMove;
  var safestMove;

  codingpains.info.name = "Gus 6 - hunt";
  if (utils.canKill(player, enemies)) return 'shoot';

  turnMove = turnToKill(player, enemies);
  if (turnMove && isMovementSafe(turnMove, player, enemies, map)) return turnMove;

  chaseMove = chaseEnemy(player, enemies, map);
  if (chaseMove && isMovementSafe(chaseMove, player, enemies, map)) return chaseMove;

  safestMove = getSafestMove(player, enemies, map);
  if (safestMove) return safestMove;

  return false;
};

var gatherer = function(player, enemies, map) {
  var ammoMove;
  var safestMove;
  var centerMove;

  codingpains.info.name = 'Gus 6 - gather';
  if (!map.ammoPosition.length) {
    centerMove = goToCenter(player, map);
    if (isMovementSafe(centerMove, player, enemies, map)) {
      return centerMove;
    }

  } else {
    ammoMove = shouldMoveForAmmo(player, enemies, map);
    if (ammoMove && isMovementSafe(ammoMove, player, enemies, map)) {
      return ammoMove;
    }

    centerMove = goToCenter(player, map);
    if (isMovementSafe(centerMove, player, enemies, map)) {
      return centerMove;
    }
  }

  safestMove = getSafestMove(player, enemies, map)

  if (safestMove) {
    return safestMove;
  }

  return utils.safeRandomMove();
};

var codingpains = {
  info: {
    name: 'Codingpains',
    style: 0
  },
  ai: function(player, enemies, map) {
    // if (canDie(player, enemies)) return eluder(player, enemies, map);
    if (player.ammo) return hunter(player, enemies, map);
    return gatherer(player, enemies, map);
  }
};

module.exports = codingpains;
