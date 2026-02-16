import { useState, useCallback, useEffect, useRef } from "react";

const DIFFICULTIES = {
  beginner: { rows: 9, cols: 9, mines: 10, label: "Beginner" },
  intermediate: { rows: 16, cols: 16, mines: 40, label: "Intermediate" },
  expert: { rows: 16, cols: 30, mines: 99, label: "Expert" },
};

function createBoard(rows, cols, mines, firstClick) {
  const board = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
      row: r,
      col: c,
    }))
  );

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

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function revealCell(board, r, c) {
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

function chordReveal(board, r, c) {
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

const NUMBER_COLORS = {
  1: "#3b82f6",
  2: "#16a34a",
  3: "#ef4444",
  4: "#7c3aed",
  5: "#b91c1c",
  6: "#0891b2",
  7: "#1e1e1e",
  8: "#6b7280",
};

const FONT_LINK = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap";

function Cell({ cell, onClick, onContext, gameOver, won, cellSize }) {
  const isRevealed = cell.revealed || (gameOver && cell.mine);
  const isMineExploded = cell.revealed && cell.mine;
  const isWrongFlag = gameOver && cell.flagged && !cell.mine;
  const showMine = gameOver && cell.mine && !cell.flagged;

  const baseStyle = {
    width: cellSize,
    height: cellSize,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: cellSize * 0.48,
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    cursor: gameOver || won ? "default" : "pointer",
    userSelect: "none",
    transition: "all 0.08s ease",
    position: "relative",
    borderRadius: 3,
  };

  if (!isRevealed && !cell.flagged && !(gameOver && cell.mine)) {
    return (
      <div
        onClick={onClick}
        onContextMenu={onContext}
        style={{
          ...baseStyle,
          background: "linear-gradient(145deg, #4a4a52, #3a3a42)",
          boxShadow: "inset 1px 1px 2px rgba(255,255,255,0.08), inset -1px -1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        onMouseEnter={(e) => {
          if (!gameOver && !won) {
            e.currentTarget.style.background = "linear-gradient(145deg, #52525a, #42424a)";
            e.currentTarget.style.boxShadow = "inset 1px 1px 3px rgba(255,255,255,0.12), inset -1px -1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.3)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "linear-gradient(145deg, #4a4a52, #3a3a42)";
          e.currentTarget.style.boxShadow = "inset 1px 1px 2px rgba(255,255,255,0.08), inset -1px -1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)";
        }}
      >
        <span style={{ opacity: 0.15, fontSize: cellSize * 0.3 }}>?</span>
      </div>
    );
  }

  if (cell.flagged && !gameOver) {
    return (
      <div
        onClick={onClick}
        onContextMenu={onContext}
        style={{
          ...baseStyle,
          background: "linear-gradient(145deg, #4a4a52, #3a3a42)",
          boxShadow: "inset 1px 1px 2px rgba(255,255,255,0.08), inset -1px -1px 2px rgba(0,0,0,0.3)",
          border: "1px solid rgba(239,68,68,0.3)",
        }}
      >
        <span style={{ fontSize: cellSize * 0.45 }}>🚩</span>
      </div>
    );
  }

  if (isWrongFlag) {
    return (
      <div
        style={{
          ...baseStyle,
          background: "linear-gradient(145deg, #3a2020, #2a1515)",
          border: "1px solid rgba(239,68,68,0.4)",
        }}
      >
        <span style={{ fontSize: cellSize * 0.45, position: "relative" }}>
          🚩
          <span style={{ position: "absolute", top: -2, left: -2, fontSize: cellSize * 0.55, color: "#ef4444" }}>✕</span>
        </span>
      </div>
    );
  }

  if (isMineExploded) {
    return (
      <div
        style={{
          ...baseStyle,
          background: "radial-gradient(circle, #dc2626 0%, #7f1d1d 100%)",
          boxShadow: "0 0 12px rgba(220,38,38,0.5), inset 0 0 8px rgba(0,0,0,0.3)",
          border: "1px solid rgba(239,68,68,0.5)",
          animation: "mine-pulse 0.6s ease-out",
        }}
      >
        <span style={{ fontSize: cellSize * 0.5 }}>💣</span>
      </div>
    );
  }

  if (showMine) {
    return (
      <div
        style={{
          ...baseStyle,
          background: "linear-gradient(145deg, #2e2e36, #26262e)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <span style={{ fontSize: cellSize * 0.45, opacity: 0.8 }}>💣</span>
      </div>
    );
  }

  if (cell.flagged && gameOver && cell.mine) {
    return (
      <div
        style={{
          ...baseStyle,
          background: "linear-gradient(145deg, #1a3a1a, #153015)",
          border: "1px solid rgba(34,197,94,0.3)",
        }}
      >
        <span style={{ fontSize: cellSize * 0.45 }}>🚩</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onContextMenu={onContext}
      style={{
        ...baseStyle,
        background: "linear-gradient(145deg, #2a2a32, #222228)",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)",
        border: "1px solid rgba(0,0,0,0.2)",
        color: NUMBER_COLORS[cell.adjacent] || "#888",
      }}
    >
      {cell.adjacent > 0 && (
        <span style={{ textShadow: `0 0 8px ${NUMBER_COLORS[cell.adjacent]}44` }}>
          {cell.adjacent}
        </span>
      )}
    </div>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Minesweeper() {
  const [difficulty, setDifficulty] = useState("beginner");
  const [board, setBoard] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [firstClick, setFirstClick] = useState(true);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const [cellSize, setCellSize] = useState(32);

  const config = DIFFICULTIES[difficulty];

  useEffect(() => {
    const link = document.createElement("link");
    link.href = FONT_LINK;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    resetGame();
  }, [difficulty]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  useEffect(() => {
    function resize() {
      const maxW = Math.min(window.innerWidth - 48, 900);
      const maxH = window.innerHeight - 220;
      const cw = Math.floor(maxW / config.cols) - 2;
      const ch = Math.floor(maxH / config.rows) - 2;
      setCellSize(Math.max(18, Math.min(36, cw, ch)));
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [config.rows, config.cols]);

  function resetGame() {
    setBoard(null);
    setGameOver(false);
    setWon(false);
    setFirstClick(true);
    setTime(0);
    setRunning(false);
  }

  function getFlagCount() {
    if (!board) return 0;
    return board.flat().filter((c) => c.flagged).length;
  }

  function checkWin(b) {
    const allNonMinesRevealed = b
      .flat()
      .every((c) => c.mine || c.revealed);
    if (allNonMinesRevealed) {
      setWon(true);
      setRunning(false);
      const finalBoard = cloneBoard(b);
      finalBoard.flat().forEach((c) => {
        if (c.mine) c.flagged = true;
      });
      setBoard(finalBoard);
    }
  }

  const handleClick = useCallback(
    (r, c) => {
      if (gameOver || won) return;

      if (firstClick) {
        const newBoard = createBoard(config.rows, config.cols, config.mines, { row: r, col: c });
        const revealed = revealCell(newBoard, r, c);
        setBoard(revealed);
        setFirstClick(false);
        setRunning(true);
        checkWin(revealed);
        return;
      }

      if (!board) return;
      const cell = board[r][c];

      if (cell.flagged) return;

      if (cell.revealed) {
        const { board: newBoard, hitMine } = chordReveal(board, r, c);
        if (hitMine) {
          setGameOver(true);
          setRunning(false);
          const final = cloneBoard(newBoard);
          final.flat().forEach((c2) => {
            if (c2.mine) c2.revealed = true;
          });
          setBoard(final);
        } else {
          setBoard(newBoard);
          checkWin(newBoard);
        }
        return;
      }

      if (cell.mine) {
        const newBoard = cloneBoard(board);
        newBoard[r][c].revealed = true;
        newBoard.flat().forEach((c2) => {
          if (c2.mine) c2.revealed = true;
        });
        setBoard(newBoard);
        setGameOver(true);
        setRunning(false);
        return;
      }

      const newBoard = revealCell(board, r, c);
      setBoard(newBoard);
      checkWin(newBoard);
    },
    [board, firstClick, gameOver, won, config]
  );

  const handleContext = useCallback(
    (e, r, c) => {
      e.preventDefault();
      if (gameOver || won || firstClick) return;
      if (!board) return;
      const cell = board[r][c];
      if (cell.revealed) return;
      const newBoard = cloneBoard(board);
      newBoard[r][c].flagged = !newBoard[r][c].flagged;
      setBoard(newBoard);
    },
    [board, firstClick, gameOver, won]
  );

  const minesLeft = config.mines - getFlagCount();

  const displayBoard = board || Array.from({ length: config.rows }, (_, r) =>
    Array.from({ length: config.cols }, (_, c) => ({
      mine: false, revealed: false, flagged: false, adjacent: 0, row: r, col: c,
    }))
  );

  const gap = 2;
  const gridW = config.cols * (cellSize + gap) - gap;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #1a1a2e 0%, #16162a 30%, #0f0f1a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Space Mono', monospace",
        color: "#e0e0e0",
        padding: "16px",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes mine-pulse {
          0% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes win-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.2); }
          50% { box-shadow: 0 0 40px rgba(34,197,94,0.4); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Title */}
      <div style={{ marginBottom: 16, textAlign: "center", animation: "fade-in 0.4s ease" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 6,
            textTransform: "uppercase",
            background: "linear-gradient(135deg, #94a3b8, #e2e8f0)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
          }}
        >
          Minesweeper
        </h1>
      </div>

      {/* Difficulty Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {Object.entries(DIFFICULTIES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setDifficulty(key)}
            style={{
              padding: "6px 16px",
              border: difficulty === key ? "1px solid rgba(148,163,184,0.4)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              background: difficulty === key
                ? "linear-gradient(145deg, #3a3a4a, #2e2e3e)"
                : "transparent",
              color: difficulty === key ? "#e2e8f0" : "#6b7280",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: 1,
              textTransform: "uppercase",
              transition: "all 0.2s ease",
            }}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Status Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: Math.max(gridW, 260),
          maxWidth: "100%",
          marginBottom: 12,
          padding: "8px 16px",
          background: "linear-gradient(145deg, #22222e, #1c1c28)",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>💣</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
              color: minesLeft < 0 ? "#ef4444" : "#f59e0b",
              textShadow: `0 0 10px ${minesLeft < 0 ? "#ef444444" : "#f59e0b33"}`,
              minWidth: 36,
            }}
          >
            {minesLeft.toString().padStart(3, "0")}
          </span>
        </div>

        <button
          onClick={resetGame}
          style={{
            fontSize: 24,
            background: "none",
            border: "2px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            cursor: "pointer",
            padding: "2px 10px",
            transition: "all 0.15s ease",
            lineHeight: 1.2,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {gameOver ? "😵" : won ? "😎" : "🙂"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
              color: "#60a5fa",
              textShadow: "0 0 10px #60a5fa33",
              minWidth: 52,
              textAlign: "right",
            }}
          >
            {formatTime(time)}
          </span>
          <span style={{ fontSize: 16 }}>⏱</span>
        </div>
      </div>

      {/* Game Result Banner */}
      {(gameOver || won) && (
        <div
          style={{
            marginBottom: 10,
            padding: "6px 20px",
            borderRadius: 6,
            background: won
              ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))"
              : "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))",
            border: `1px solid ${won ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 2,
            color: won ? "#4ade80" : "#f87171",
            textTransform: "uppercase",
            animation: won ? "win-glow 2s ease infinite" : "fade-in 0.3s ease",
          }}
        >
          {won ? `Cleared in ${formatTime(time)}` : "Game Over"}
        </div>
      )}

      {/* Board */}
      <div
        ref={containerRef}
        style={{
          display: "inline-grid",
          gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
          gap: gap,
          padding: 8,
          background: "linear-gradient(145deg, #1e1e2a, #181824)",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {displayBoard.flat().map((cell) => (
          <Cell
            key={`${cell.row}-${cell.col}`}
            cell={cell}
            onClick={() => handleClick(cell.row, cell.col)}
            onContext={(e) => handleContext(e, cell.row, cell.col)}
            gameOver={gameOver}
            won={won}
            cellSize={cellSize}
          />
        ))}
      </div>

      {/* Footer Hint */}
      <div
        style={{
          marginTop: 14,
          fontSize: 10,
          color: "#4b5563",
          letterSpacing: 1.5,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: "uppercase",
        }}
      >
        Left click: reveal · Right click: flag · Click number: chord
      </div>
    </div>
  );
}
