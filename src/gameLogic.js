export function createEmptyBoard(rows, cols) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
      row: r,
      col: c,
    }))
  );
}

export function createBoard(rows, cols, mines, firstClick) {
  const board = createEmptyBoard(rows, cols);

  const excluded = new Set();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = firstClick.row + dr;
      const nc = firstClick.col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        excluded.add(`${nr},${nc}`);
      }
    }
  }

  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!board[r][c].mine && !excluded.has(`${r},${c}`)) {
      board[r][c].mine = true;
      placed++;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) {
            count++;
          }
        }
      }
      board[r][c].adjacent = count;
    }
  }

  return board;
}

export function cloneBoard(board) {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function revealCell(board, r, c) {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = cloneBoard(board);
  const stack = [[r, c]];

  while (stack.length > 0) {
    const [cr, cc] = stack.pop();
    if (cr < 0 || cr >= rows || cc < 0 || cc >= cols) continue;
    const cell = newBoard[cr][cc];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.adjacent === 0 && !cell.mine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          stack.push([cr + dr, cc + dc]);
        }
      }
    }
  }

  return newBoard;
}

export function chordReveal(board, r, c) {
  const rows = board.length;
  const cols = board[0].length;
  const cell = board[r][c];
  if (!cell.revealed || cell.adjacent === 0) return { board, hitMine: false };

  let flagCount = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].flagged) {
        flagCount++;
      }
    }
  }

  if (flagCount !== cell.adjacent) return { board, hitMine: false };

  let newBoard = cloneBoard(board);
  let hitMine = false;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const neighbor = newBoard[nr][nc];
        if (!neighbor.revealed && !neighbor.flagged) {
          if (neighbor.mine) {
            hitMine = true;
            neighbor.revealed = true;
          } else {
            newBoard = revealCell(newBoard, nr, nc);
          }
        }
      }
    }
  }

  return { board: newBoard, hitMine };
}

export function countFlags(board) {
  return board.flat().filter((c) => c.flagged).length;
}

export function checkAllRevealed(board) {
  return board.flat().every((c) => c.mine || c.revealed);
}

export function revealAllMines(board) {
  const newBoard = cloneBoard(board);
  newBoard.flat().forEach((c) => {
    if (c.mine) c.revealed = true;
  });
  return newBoard;
}

export function flagAllMines(board) {
  const newBoard = cloneBoard(board);
  newBoard.flat().forEach((c) => {
    if (c.mine) c.flagged = true;
  });
  return newBoard;
}
