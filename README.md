# ClashJS

This is an experiment. The idea is to create a battle game, where the participants code their AI, and then we make them fight!

The repo doesn't contain any code yet, just work-in-progress specs.


# Game. Functional(?) Spec.

## Introduction.
Games and coding are fun! I want to make a game where we can confront AI vs AI.

The game is simple: we will put all the players in a battle arena, and then make them fight to death. We will put a coin in the arena, and the players should try to collect it. The last player alive, or the first to collect 10 coins, wins!

### Game characteristics.
* Every player will have a position and direction on the grid. A player can not go over the grid limits, and can only face north, west, south or east.
* The game will be turn based. Every turn we will excecute the AI of every player passing as arguments:
  * The current position and direction of the player.
  * The position of all other players.
  * The position of the coins.
  * A environment configuration option with:
    * Grid size.
* Every turn a player must execute some of the following actions:
  * Move one step in its current direction.
  * Turn into any of the four directions.
  * Shoot.
* A player can shoot to try to destroy another player. The shoots have the following characteristics:
  * The shoots are executed before the movements in every turn.
  * A shoot have a range of 3 squares.
  * After a shoot, a player will be paralized for the following 3 turns.
* A player can collect a coin in the moment it steps over it. A new coin may appear in any moment of the game.
* If nobody dies or collects a coin in 50 turns, the game will be considered a tie with all the survivors.

### FAQ
#### What happens if two players shots each other in the same turn?
They both die.

#### What happens if two player try to move to the same square?
The will both move to that square. Players can overlap. I hope one of them to be smart enough to kill the other ASAP.

##### And if there is a coin..?
Both of them gets it. There can be a tie.

#### And if a players tries to move out of the grid?
They will simple do not move.


# Game Technical Spec.

## Problem.
We should make an app that can take functions provided by the users, execute them, and render the game as specified in the functional spec.

## Constraints.
* Just. The game mechanics should avoid to accidentally benefit players by its random nature. The order of execution of the AIs should not benefit any player. The position of the newly create coins should try to be as just for everyone.
* Be safe. A player code should not be able to modify anything other than itself.
* Be resilient as possible. If a player crashes or stop responding, the show must go on.

## Hypothesis.

Let the *player definition* be an object with the player info and its AI function.

  {
    name: 'javierbyte',
    ai: function(player, otherPlayers, env) {
      // think...
      return 'move';
    }
  }

Let the *user state* be an object with a user information like the following:

  {
    xPos: <number>,
    yPos: <number>,
    direction: <number>, // 0: north, 1: east, 2: south, 3: west
    coinsCollected: <number>,
    paralizedTurns: <number>
  }

Let the *game environment* be a configuration object like the following:

  {
    gridSize: [<number>, <number>],
    ammoPosition: <array of [<number>, <number>] arrays>
  }

Let the *game state* be an object with the array of all user states, and the game environment.

  {
    userStates: <array of user states>,
    environment: <game environment>
  }

### Architecture.

We can divide the problem in 3 big steps.

* **AI Runner**. This will take all the user provided functions and the current game state, and execute every function.
  * This will take care of catch errors on the functions, and stop non-responding functions to hang the window.
* **Game Core**. This will take the responses that the AI Runners sends, and apply the game logic on them.
  * Kill killed players.
  * Move and turn players.
  * Collect and count coins.
  * Generate new coins if necessary.
  * Set the paralized turns to players that shooted.
  * Count if too many inactive turns had passed.
  * Stop the game when it ends.
* **Render**. This will take the game state and render it nicely.

They will interact as follows:

![](assets/game-blackbox.png)
<!---
sequenceDiagram
AI Runner->> Game Core: Array of objects
Note left of Game Core: The AI runners sends <br/> the results of <br/>executing the code <br/> of every player<br/>on the current game<br/>state.
Game Core->> Render: Game state
Note left of Render: The core applies the<br/>results to the game,<br/>computes the new<br/>state, and sends<br/>it to the render.
Note left of Game Core: The Core sends the<br/>new game state to<br/>the AI runner<br/>to execute all<br/>functions again.
Game Core->>AI Runner: Game State

http://knsv.github.io/mermaid/live_editor/
-->


# AI Runner. Spec.

## Problem.
The AI runner should execute all the functions that the players provided, with the current user state, all user states, and game enrivonment as arguments.

## Constraints.
* Prevent the user functions to modify anything except itself.
* Catch executions errors, and simply return `null` as response to the Game Core.
* Detect if any functions gets stuck in an infinite loop, and return `null` as response.

## Hypothesis.
We can run the functions as WebWorkers because:
* They can not access the dom and modify things.
* Runs in a sandbox. If they crash or stop responding we can detect it.
* Bonus: We can parallelise the excecution.

The game is designed to make irrelevant the order of execution of the AIs. So we are safe running all this asynchronous.

## Solution.
To prevent the functions to take so much time thinking (probably because an infinite loop), we will create an array of `null`s, where we will put the responses of the workers as they arrive. If `X` seconds passes (enough time to think for almost everything, except infinite loops, of couse) then we will pass the `null`ified response of that worker, and the Game Core will kill that player.

![](assets/airunner-blackbox.png)
<!---
sequenceDiagram
Game Core->> AI Runner: Game State
Note left of AI Runner: Starts a countdown<br/>of X seconds.
AI Runner->> Worker0: Arguments
AI Runner->> Worker1: Arguments
Worker1->> AI Runner: Response
AI Runner->> Worker2: Arguments
Worker0->> AI Runner: Response
Worker2->> AI Runner: Response
Note left of AI Runner: When all the workers<br/>responds, or the<br/>countdown hits 0<br/>return the values<br/>to the Game Core.
AI Runner->> Game Core: Results

http://knsv.github.io/mermaid/live_editor/
-->

# CashJS Core.

This is a javascript class that will receive the initial world environment, the player functions, and will calculate the game state.

## Arguments:
  * Players. An array of *player definition* objects.

## Methods:
  * getState. Will return the current game state.
  * nextStep. Will execute a step for every player (all individual plys).
  * _nextPly. Will execute a step for the next player. (A ply).

## Example:

  this.ClashJS = new ClashJS();
