export default function Cell({ cell, onClick, onContext, gameOver, won }) {
  const isRevealed = cell.revealed || (gameOver && cell.mine);
  const isMineExploded = cell.revealed && cell.mine;
  const isWrongFlag = gameOver && cell.flagged && !cell.mine;
  const showMine = gameOver && cell.mine && !cell.flagged;

  let variant;
  let content = null;

  if (!isRevealed && !cell.flagged && !(gameOver && cell.mine)) {
    variant = "unrevealed";
    content = <span className="cell-hint">?</span>;
  } else if (cell.flagged && !gameOver) {
    variant = "flagged";
    content = <span className="cell-emoji">🚩</span>;
  } else if (isWrongFlag) {
    variant = "wrong-flag";
    content = (
      <span className="cell-emoji">
        🚩
        <span className="cell-wrong-x">✕</span>
      </span>
    );
  } else if (isMineExploded) {
    variant = "exploded";
    content = <span className="cell-emoji cell-emoji--lg">💣</span>;
  } else if (showMine) {
    variant = "mine";
    content = <span className="cell-emoji cell-emoji--dim">💣</span>;
  } else if (cell.flagged && gameOver && cell.mine) {
    variant = "correct-flag";
    content = <span className="cell-emoji">🚩</span>;
  } else {
    variant = "revealed";
    content =
      cell.adjacent > 0 ? (
        <span className="cell-number">{cell.adjacent}</span>
      ) : null;
  }

  return (
    <div
      className={`cell cell--${variant}`}
      data-adjacent={cell.adjacent}
      onClick={onClick}
      onContextMenu={onContext}
    >
      {content}
    </div>
  );
}
