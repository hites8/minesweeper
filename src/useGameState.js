import { useState, useCallback, useEffect, useRef } from "react";
import {
  createBoard,
  createEmptyBoard,
  revealCell,
  chordReveal,
  cloneBoard,
  checkAllRevealed,
  countFlags,
  revealAllMines,
  flagAllMines,
} from "./gameLogic";
import { DIFFICULTIES } from "./constants";

export function useGameState() {
  const [difficulty, setDifficulty] = useState("beginner");
  const [board, setBoard] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [firstClick, setFirstClick] = useState(true);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [cellSize, setCellSize] = useState(32);
  const timerRef = useRef(null);

  const config = DIFFICULTIES[difficulty];

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

  function handleWin(b) {
    if (checkAllRevealed(b)) {
      setWon(true);
      setRunning(false);
      setBoard(flagAllMines(b));
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
        handleWin(revealed);
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
          setBoard(revealAllMines(newBoard));
        } else {
          setBoard(newBoard);
          handleWin(newBoard);
        }
        return;
      }

      if (cell.mine) {
        const newBoard = cloneBoard(board);
        newBoard[r][c].revealed = true;
        setBoard(revealAllMines(newBoard));
        setGameOver(true);
        setRunning(false);
        return;
      }

      const newBoard = revealCell(board, r, c);
      setBoard(newBoard);
      handleWin(newBoard);
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

  const displayBoard = board || createEmptyBoard(config.rows, config.cols);
  const minesLeft = config.mines - countFlags(displayBoard);

  return {
    difficulty,
    setDifficulty,
    config,
    board: displayBoard,
    gameOver,
    won,
    time,
    cellSize,
    minesLeft,
    handleClick,
    handleContext,
    resetGame,
  };
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
