import { useState } from "react";

// enum for all possible cell caps
// all cell images. Initially they're all 'fresh'
const cellCaps = {
  bomb: "💣",
  "-2": "💣",
  flag: "❓",
  "-1": "❓",
  target: "🎯",
  "-4": "🎯",
  fresh: "⬜",
  0: "🟩",
  1: "1️⃣",
  2: "2️⃣",
  3: "3️⃣",
  4: "4️⃣",
  5: "5️⃣",
  6: "6️⃣",
  7: "7️⃣",
  8: "8️⃣"
};

// enum for possible cell values
const cellValues = {
  target: -4,
  void: -3,
  bomb: -2,
  flag: -1,
  fresh: 0,
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8
};

const directions = {
  0: "N",
  1: "NE",
  2: "E",
  3: "SE",
  4: "S",
  5: "SW",
  6: "W",
  7: "NW"
};

const densities = [0.05, 0.125, 0.25];

const freshCell = { cap: cellCaps.fresh, value: cellValues[0], r: 0, c: 0 };
const voidCell = { cap: cellCaps.fresh, value: cellValues.void, r: -1, c: -1 };

// checks which edged the cell is touching
const onEdge = (grid, cell) => ({
  C: true,
  N: cell.r === 0,
  NE: cell.r === 0 || cell.c === grid[0].length - 1,
  E: cell.c === grid[0].length - 1,
  SE: cell.c === grid[0].length - 1 || cell.r === grid.length - 1,
  S: cell.r === grid.length - 1,
  SW: cell.r === grid.length - 1 || cell.c === 0,
  W: cell.c === 0,
  NW: cell.c === 0 || cell.r === 0
});

// get neighbor cell: returns the cell object at direction
const getNeighbor = (grid, cell, direction) => {
  const edge = onEdge(grid, cell);

  let hDistance = 0;
  let vDistance = 0;

  if (direction.includes("E")) hDistance = 1;
  else if (direction.includes("W")) hDistance = -1;

  if (direction.includes("N")) vDistance = -1;
  else if (direction.includes("S")) vDistance = 1;

  let neighbor = voidCell;

  if (!edge[direction]) neighbor = grid[cell.r + vDistance][cell.c + hDistance];

  return neighbor;
};

// get all neighbors
const getAllNeighbors = (grid, cell) => {
  const neighbors = [];

  Object.values(directions).forEach((dir) => {
    const neighbor = getNeighbor(grid, cell, dir);
    neighbors.push(neighbor);
  });
  return neighbors;
};

const allNeighborMinesFlagged = (grid, cell) => {
  const neighbors = getAllNeighbors(grid, cell);

  const neighborMines = neighbors.filter((n) => n.value === cellValues.bomb);

  const unflaggedMines = neighborMines.filter(
    (n) => ![cellCaps.flag, cellCaps.target].includes(n.cap)
  );

  const result = unflaggedMines.length === 0;

  return result;
};

// 1. generates a square grid [size * size]
const generateBlankGrid = (size = 12) => {
  const result = [];

  for (let r = 0; r < size; r++) {
    result[r] = [];
    for (let c = 0; c < size; c++) {
      result[r].push({ ...freshCell, r, c });
    }
  }

  return result;
};

// 2. randomly adds bombs to a grid
const plantBombs = (grid = [], density) => {
  if (grid.length < 1) return grid;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const chance = Math.random();
      if (chance < densities[density]) {
        grid[r][c].value = cellValues.bomb;
      }
    }
  }

  return grid;
};

// 3. set cell values to represent number of neighboring bombs
const setValues = (grid = []) => {
  if (grid.length < 1) return grid;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (cell.value !== cellValues.bomb) {
        const neighbors = getAllNeighbors(grid, cell);
        let newValue = 0;
        neighbors.forEach((n) => {
          if (n.value === cellValues.bomb) {
            newValue++;
          }
        });
        grid[r][c].value = newValue;
      }
    }
  }

  return grid;
};

const createGameBoard = (size = 12, density = 1) => {
  let aGrid = generateBlankGrid(size);
  let bGrid = plantBombs(aGrid, density);
  let cGrid = setValues(bGrid);
  return cGrid;
};

function Cell({ cell, onCellClick, onCellRightClick }) {
  return (
    <span
      className="cell"
      onClick={() => onCellClick(cell)}
      onContextMenu={(e) => onCellRightClick(e, cell)}
    >
      {cell.cap}
    </span>
  );
}

function Row({ row, onCellClick, onCellRightClick }) {
  return (
    <div className="row">
      {row.map((cell) => {
        return (
          <Cell
            key={`${cell.r}-${cell.c}`}
            cell={cell}
            onCellClick={onCellClick}
            onCellRightClick={onCellRightClick}
          />
        );
      })}
    </div>
  );
}

export default function Game() {
  const [board, setBoard] = useState([]);

  const [game, setGame] = useState("");

  const gameSizes = ["12x12", "20x20", "32x32"];

  const [gameSize, setGameSize] = useState(gameSizes[0]);

  const gameDifs = ["🐶", "🦁", "🦍"];

  const [gameDif, setGameDif] = useState(gameDifs[0]);

  const [scale, setScale] = useState(1);

  const newGame = () => {
    const size = Number(gameSize.slice(0, 2));
    const density = gameDifs.indexOf(gameDif);
    const game = createGameBoard(size, density);
    setBoard(game);
    setGame(gameDif);
    setScale(40 / size);
  };

  const loseGame = () => {
    const newBoard = [...board];

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        newBoard[r][c].cap = cellCaps[board[r][c].value];
      }
    }

    setBoard(newBoard);
    setGame("☠️");
  };

  const reveal = (cell, bypass = false) => {
    let newBoard = [...board];
    if (cell.value > 0 && !bypass) {
      newBoard[cell.r][cell.c].cap = cellCaps[cell.value];
      // if cell is revealed && all neighboring mines are flagged
      if (cell.cap !== cellCaps.fresh && allNeighborMinesFlagged(board, cell)) {
        console.log(11);
        reveal(cell, true);
      }
    }
    if (cell.value === 0 || bypass === true) {
      console.log("BP");
      newBoard[cell.r][cell.c].cap = cellCaps[cell.value];
      // reveal all neighbor cells to the edge of > 0
      const neighbors = getAllNeighbors(board, cell);
      neighbors.forEach((n) => {
        if (
          n.value !== cellValues.bomb &&
          n !== voidCell &&
          cellCaps[n.value] !== n.cap
        ) {
          newBoard[n.r][n.c].cap = cellCaps[newBoard[n.r][n.c].value];
          if (n.value === 0) {
            console.log("r", n.cap, cellCaps[n.value], n.value);
            reveal(n);
          }
        }
      });
    }
    setBoard(newBoard);
  };

  const checkGame = () => {
    let gameWon = true;
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const cell = board[r][c];
        if (cell.cap === cellCaps.fresh) gameWon = false;
      }
    }

    if (gameWon) setGame("🏆");
  };

  const onCellClick = (cell) => {
    if (cell.value === cellValues.bomb) loseGame();
    else {
      reveal(cell);
      checkGame();
    }
  };

  const onCellRightClick = (e, cell) => {
    e.preventDefault();
    const newBoard = [...board];
    const newCell = { ...cell };
    if (cell.cap === cellCaps.target) {
      newCell.cap = cellCaps.fresh;
    } else if (cell.cap === cellCaps.flag) {
      newCell.cap = cellCaps.target;
    } else {
      newCell.cap = cellCaps.flag;
    }
    newBoard[cell.r][cell.c] = newCell;
    setBoard(newBoard);
    checkGame();
  };

  return (
    <div style={{ fontSize: "1em" }}>
      <button style={{ fontSize: "2.4em" }} onClick={newGame}>
        New Game
      </button>
      <select
        style={{ fontSize: "2.5em" }}
        value={gameSize}
        onChange={(e) => setGameSize(e.target.value)}
      >
        {gameSizes.map((gs) => (
          <option key={gs} value={gs}>
            {gs}
          </option>
        ))}
      </select>
      <select
        style={{ fontSize: "2.5em" }}
        value={gameDif}
        onChange={(e) => setGameDif(e.target.value)}
      >
        {gameDifs.map((gd) => (
          <option key={gd} value={gd}>
            {gd}
          </option>
        ))}
      </select>
      <br />
      <span style={{ fontSize: "2.5em" }}>{game}</span>
      {board.length > 0 && (
        <div className="BoardWrap" style={{ fontSize: `${scale}em` }}>
          {board.map((r, i) => (
            <Row
              key={`row-${i}`}
              row={r}
              onCellClick={onCellClick}
              onCellRightClick={onCellRightClick}
            />
          ))}
          <br />
        </div>
      )}
    </div>
  );
}
