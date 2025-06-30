import React, { useState, useEffect } from "react";
import "./App.css";

// Backend API base URL (change if needed)
const API_BASE = "http://localhost:3001";

// PUBLIC_INTERFACE
function App() {
  // LOGIN/SESSION STATE
  const [playerName, setPlayerName] = useState("");
  const [opponentName, setOpponentName] = useState(""); // for new games
  const [playerId, setPlayerId] = useState(null);
  const [asGuest, setAsGuest] = useState(true);

  // GAME STATE
  const [gameId, setGameId] = useState(null);
  const [playerSymbol, setPlayerSymbol] = useState(null); // "X" or "O"
  const [gameStatus, setGameStatus] = useState(null); // "ongoing"/"complete"
  const [gameBoard, setGameBoard] = useState(Array(9).fill(null));
  const [winner, setWinner] = useState(null);
  const [moveMessage, setMoveMessage] = useState("");
  const [movePending, setMovePending] = useState(false);

  // HISTORY
  const [gameHistory, setGameHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // UI
  const [showHistory, setShowHistory] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [opponentSelection, setOpponentSelection] = useState(false);

  // Theme (from existing template)
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  // --- HANDLERS ---

  // PUBLIC_INTERFACE
  function handleLogin(e) {
    e.preventDefault();
    if (!playerName) return;
    setPlayerId(null);
    setGameId(null);
    setShowLogin(false);
    setOpponentSelection(true);
  }

  // PUBLIC_INTERFACE
  function handleStartGame(e) {
    e.preventDefault();
    if (!playerName || !opponentName) return;
    fetch(`${API_BASE}/game/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_x_name: playerName,
        player_o_name: opponentName,
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => {
        // Determine player symbol by which name matches the user
        setGameId(data.game_id);
        if (data.player_x_id && playerName === opponentName) {
          // Guest vs Guest (both same name), assign "X"
          setPlayerId(data.player_x_id);
          setPlayerSymbol("X");
        } else if (playerName === opponentName) {
          setPlayerId(data.player_x_id);
          setPlayerSymbol("X");
        } else if (data.player_x_id && playerName === opponentName) {
          setPlayerId(data.player_x_id);
          setPlayerSymbol("X");
        } else if (playerName === data.player_x_id) {
          setPlayerSymbol("X");
          setPlayerId(data.player_x_id);
        } else if (playerName === data.player_o_id) {
          setPlayerSymbol("O");
          setPlayerId(data.player_o_id);
        } else {
          // Compare to submitted names
          setPlayerSymbol(
            playerName.trim() ===
              (opponentName.trim() === playerName.trim()
                ? "X"
                : "O")
              ? "X"
              : "O"
          );
        }

        // Try both: load board to display
        fetchGameState(data.game_id);
        setOpponentSelection(false);
        setMoveMessage("");
        setGameStatus(null);
        setWinner(null);
      })
      .catch((err) => {
        setMoveMessage("Error starting game: " + err.message);
      });
  }

  // PUBLIC_INTERFACE
  function handleMove(index) {
    if (movePending || gameBoard[index] || gameStatus === "complete") return;
    setMovePending(true);
    setMoveMessage("");
    fetch(`${API_BASE}/game/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_id: gameId,
        player_id: playerId,
        position: index,
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => {
        setGameBoard(data.board);
        setGameStatus(data.status);
        setWinner(data.winner);
        if (data.status === "complete") {
          setMoveMessage(
            data.winner
              ? `Winner: ${data.winner} ${data.winner === playerSymbol ? "(You!)" : ""}`
              : "It's a draw!"
          );
        }
      })
      .catch((err) => setMoveMessage("Move error: " + err.message))
      .finally(() => setMovePending(false));
  }

  // PUBLIC_INTERFACE
  function fetchGameState(gid) {
    fetch(`${API_BASE}/game/state/${gid}`)
      .then((r) => r.json())
      .then((data) => {
        setGameStatus(data.status);
        setGameBoard(data.board);
        setWinner(data.winner);
      })
      .catch(() =>
        setMoveMessage("Could not load game state. Refresh or start new game.")
      );
  }

  // PUBLIC_INTERFACE
  function handleShowHistory() {
    if (!playerId) return;
    setShowHistory(true);
    setHistoryLoading(true);
    fetch(`${API_BASE}/game/history/${playerId}`)
      .then((r) => r.json())
      .then((data) => {
        setGameHistory(data.history);
      })
      .catch(() =>
        setGameHistory([{ game_id: 0, status: "no games found", player_symbol: "-", winner: "-" }])
      )
      .finally(() => setHistoryLoading(false));
  }

  // PUBLIC_INTERFACE
  function handleResumeGame(historyEntry) {
    setGameId(historyEntry.game_id);
    fetchGameState(historyEntry.game_id);
    setShowHistory(false);
    setMoveMessage("");
  }

  // --- RENDERED UI COMPONENTS ---

  // Login/Guest UI
  if (showLogin) {
    return (
      <div className="App">
        <header className="App-header">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
          <h1>Tic Tac Toe</h1>
          <form
            style={{ maxWidth: 300, margin: "20px auto" }}
            onSubmit={handleLogin}
          >
            <label style={{ fontWeight: 500 }}>
              Enter your name:
              <input
                style={{
                  margin: "1em",
                  padding: 8,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  width: "100%",
                }}
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
                autoFocus
              />
            </label>
            <br />
            <button className="theme-toggle" type="submit">
              Continue
            </button>
          </form>
          <small>
            No registration required. Choose any name. Play as guest or with
            friends!
          </small>
        </header>
      </div>
    );
  }

  // Opponent selection (start new game)
  if (opponentSelection) {
    return (
      <div className="App">
        <header className="App-header">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
          <h2>Hello, {playerName}!</h2>
          <form
            onSubmit={handleStartGame}
            style={{ maxWidth: 350, margin: "20px auto" }}
          >
            <label style={{ fontWeight: 500 }}>
              Enter opponent's name:
              <input
                style={{
                  margin: "1em",
                  padding: 8,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  width: "100%",
                }}
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                required
              />
            </label>
            <br />
            <button className="theme-toggle" type="submit">
              Start Game
            </button>
          </form>
          <button
            className="theme-toggle"
            style={{ marginTop: 20, background: "#888" }}
            onClick={() => {
              setShowLogin(true);
              setOpponentSelection(false);
              setOpponentName("");
              setPlayerName("");
            }}
          >
            Back
          </button>
          <p style={{ color: "#e74c3c" }}>{moveMessage}</p>
        </header>
      </div>
    );
  }

  // Main game view
  return (
    <div className="App">
      <header className="App-header">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        <h1>
          Tic Tac Toe
          <span style={{ fontSize: 18, fontWeight: 400, marginLeft: 8 }}>
            | Player: {playerName}
          </span>
        </h1>
        {gameId && (
          <div style={{ margin: "6px 0 18px 0" }}>
            <strong>Game ID:</strong> {gameId}
          </div>
        )}
        <Board
          board={gameBoard}
          onClick={handleMove}
          disabled={gameStatus === "complete"}
        />
        <GameStatus
          status={gameStatus}
          winner={winner}
          playerSymbol={playerSymbol}
        />
        <p style={{ minHeight: 24, color: moveMessage ? "#E87A41" : "" }}>
          {moveMessage}
        </p>
        <div style={{ margin: "12px 0" }}>
          <button className="theme-toggle" onClick={() => setOpponentSelection(true)}>
            Start New Game
          </button>
          <button
            className="theme-toggle"
            style={{ marginLeft: 10, backgroundColor: "#424242" }}
            onClick={handleShowHistory}
          >
            View My History
          </button>
        </div>
        {showHistory && (
          <GameHistory
            loading={historyLoading}
            history={gameHistory}
            onResume={handleResumeGame}
            onClose={() => setShowHistory(false)}
          />
        )}
      </header>
    </div>
  );
}

// PUBLIC_INTERFACE
function Board({ board, onClick, disabled }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 62px)",
        gap: 7,
        margin: "35px auto",
      }}
    >
      {board.map((cell, idx) => (
        <button
          key={idx}
          onClick={() => onClick(idx)}
          disabled={cell || disabled}
          style={{
            width: 60,
            height: 60,
            fontSize: 32,
            fontWeight: 700,
            background: "#fafbfc",
            color: "#1976D2",
            border: "2px solid var(--border-color)",
            borderRadius: 8,
            cursor: cell || disabled ? "default" : "pointer",
            transition: "all .15s cubic-bezier(.4,0,.2,1)",
          }}
        >
          {cell}
        </button>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function GameStatus({ status, winner, playerSymbol }) {
  if (!status) return <div style={{ minHeight: 32 }}>Start playing!</div>;
  if (status === "ongoing")
    return (
      <div style={{ color: "#1976D2", fontWeight: "bold", minHeight: 32 }}>
        Game in progress {playerSymbol && `(You're ${playerSymbol})`}
      </div>
    );
  if (status === "complete")
    return (
      <div
        style={{
          color: winner ? "#3CB371" : "#868686",
          fontWeight: 700,
          fontSize: 20,
          minHeight: 32,
        }}
      >
        {winner
          ? `Winner: ${winner} ${winner === playerSymbol ? "(You!)" : ""}`
          : "It's a draw!"}
      </div>
    );
  return null;
}

// PUBLIC_INTERFACE
function GameHistory({ loading, history, onResume, onClose }) {
  return (
    <div
      style={{
        padding: "18px 24px",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
        color: "#222",
        margin: "18px auto",
        minWidth: 290,
        maxWidth: 400,
      }}
    >
      <h3>My Game History</h3>
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          right: 28,
          top: 18,
          background: "none",
          border: "none",
          fontSize: 18,
          cursor: "pointer",
        }}
      >
        ✖
      </button>
      {loading && <p>Loading ...</p>}
      {!loading && (history.length < 1 || !history[0].game_id) && (
        <p>No games found.</p>
      )}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {history.map((h) => (
          <li key={h.game_id} style={{ marginBottom: 6 }}>
            <span>
              Game #{h.game_id} &ndash;{" "}
              {h.status === "ongoing" ? "Ongoing" : h.status === "complete" ? "Complete" : h.status}
            </span>
            <span style={{ marginLeft: 10 }}>
              {h.winner
                ? `Winner: ${h.winner}`
                : h.status === "complete"
                ? "Draw"
                : ""}
            </span>
            <button
              style={{
                marginLeft: 18,
                borderRadius: 5,
                padding: "2px 8px",
                border: "1px solid #CCC",
                background: "#ececec",
                cursor: "pointer",
              }}
              onClick={() => onResume(h)}
            >
              Resume
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
