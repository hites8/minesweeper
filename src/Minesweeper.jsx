import Cell from "./Cell";
import { useGameState, formatTime } from "./useGameState";
import { DIFFICULTIES } from "./constants";
import "./minesweeper.css";

export default function Minesweeper() {
  const {
    difficulty,
    setDifficulty,
    config,
    board,
    gameOver,
    won,
    time,
    cellSize,
    minesLeft,
    handleClick,
    handleContext,
    resetGame,
  } = useGameState();

  const ended = gameOver || won;

  return (
    <div className="game-container">
      <div className="game-title">
        <h1>Minesweeper</h1>
      </div>

      <div className="difficulty-tabs">
        {Object.entries(DIFFICULTIES).map(([key, val]) => (
          <button
            key={key}
            className={`difficulty-tab${difficulty === key ? " difficulty-tab--active" : ""}`}
            onClick={() => setDifficulty(key)}
          >
            {val.label}
          </button>
        ))}
      </div>

      <div
        className="status-bar"
        style={{ width: Math.max(config.cols * (cellSize + 2) - 2, 260) }}
      >
        <div className="status-section">
          <span className="status-icon">💣</span>
          <span className={`mine-counter${minesLeft < 0 ? " mine-counter--negative" : ""}`}>
            {minesLeft.toString().padStart(3, "0")}
          </span>
        </div>

        <button className="reset-button" onClick={resetGame}>
          {gameOver ? "😵" : won ? "😎" : "🙂"}
        </button>

        <div className="status-section">
          <span className="timer-display">{formatTime(time)}</span>
          <span className="status-icon">⏱</span>
        </div>
      </div>

      {ended && (
        <div className={`game-banner ${won ? "game-banner--won" : "game-banner--lost"}`}>
          {won ? `Cleared in ${formatTime(time)}` : "Game Over"}
        </div>
      )}

      <div
        className={`board${ended ? " board--ended" : ""}`}
        style={{
          gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
          "--cell-size": `${cellSize}px`,
        }}
      >
        {board.flat().map((cell) => (
          <Cell
            key={`${cell.row}-${cell.col}`}
            cell={cell}
            onClick={() => handleClick(cell.row, cell.col)}
            onContext={(e) => handleContext(e, cell.row, cell.col)}
            gameOver={gameOver}
            won={won}
          />
        ))}
      </div>

      <div className="footer-hint">
        Left click: reveal · Right click: flag · Click number: chord
      </div>
    </div>
  );
}
