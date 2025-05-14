document.addEventListener("DOMContentLoaded", () => {
  const height = 6;
  const width = 5;

  let row = 0;
  let col = 0;
  let gameOver = false;
  let gameId = null;
  let currentWord = "";

  const homeScreen = document.getElementById("home-screen");
  const gameScreen = document.getElementById("game-screen");
  const resultScreen = document.getElementById("result-screen");
  const statsScreen = document.getElementById("stats-screen");
  const loginScreen = document.getElementById("login-screen");
  const registerScreen = document.getElementById("register-screen");

  const board = document.getElementById("board");
  const keyboard = document.getElementById("keyboard");
  const message = document.getElementById("message");

  const playButton = document.getElementById("play-button");
  const newGameButton = document.getElementById("new-game-button");
  const exitButton = document.getElementById("exit-button");
  const statsButton = document.getElementById("stats-button");
  const closeStatsButton = document.getElementById("close-stats-button");

  const loginButton = document.getElementById("login-button");
  const registerButton = document.getElementById("register-button");
  const logoutButton = document.getElementById("logout-button");
  const cancelLoginButton = document.getElementById("cancel-login-button");
  const cancelRegisterButton = document.getElementById("cancel-register-button");

  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  const usernameDisplay = document.getElementById("username-display");

  const darkModeButton = document.getElementById("dark-mode-button");
  const darkModeIcon = document.getElementById("dark-mode-icon");

  initApp();
  checkDarkModePreference();

  playButton.addEventListener("click", startGame);
  newGameButton.addEventListener("click", startGame);
  exitButton.addEventListener("click", showHomeScreen);

  statsButton.addEventListener("click", showStatsScreen);
  closeStatsButton.addEventListener("click", hideStatsScreen);

  loginButton.addEventListener("click", showLoginScreen);
  registerButton.addEventListener("click", showRegisterScreen);
  logoutButton.addEventListener("click", logout);
  cancelLoginButton.addEventListener("click", hideLoginScreen);
  cancelRegisterButton.addEventListener("click", hideRegisterScreen);

  loginForm.addEventListener("submit", handleLogin);
  registerForm.addEventListener("submit", handleRegister);

  darkModeButton.addEventListener("click", toggleDarkMode);

  async function initApp() {
    createKeyboard();
    checkUserStatus();
    loadStats();
  }

  function checkDarkModePreference() {
    const darkMode = localStorage.getItem("darkMode") === "true";
    if (darkMode) {
      document.body.classList.add("dark-mode");
      darkModeIcon.textContent = "☀️";
    } else {
      document.body.classList.remove("dark-mode");
      darkModeIcon.textContent = "🌙";
    }
  }

  function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", isDarkMode);
    darkModeIcon.textContent = isDarkMode ? "☀️" : "🌙";
  }

  async function checkUserStatus() {
    try {
      const response = await fetch("/api/user");
      const data = await response.json();
      if (data.loggedIn) {
        usernameDisplay.textContent = data.username;
        loginButton.style.display = "none";
        registerButton.style.display = "none";
        logoutButton.style.display = "inline-block";
        document.getElementById("home-stats").style.display = "block";
        const statsResponse = await fetch("/api/stats");
        const stats = await statsResponse.json();
        document.getElementById("home-games-played").textContent = stats.gamesPlayed;
        document.getElementById("home-win-percentage").textContent = stats.winPercentage;
        document.getElementById("home-current-streak").textContent = stats.currentStreak;
        document.getElementById("home-max-streak").textContent = stats.maxStreak;
      } else {
        usernameDisplay.textContent = "";
        loginButton.style.display = "inline-block";
        registerButton.style.display = "inline-block";
        logoutButton.style.display = "none";
        document.getElementById("home-stats").style.display = "none";
      }
    } catch (error) {
      console.error("Error checking user status:", error);
      showToast("Error checking user status");
    }
  }

  async function loadStats() {
    try {
      const response = await fetch("/api/stats");
      const stats = await response.json();
      document.getElementById("games-played").textContent = stats.gamesPlayed;
      document.getElementById("win-percentage").textContent = stats.winPercentage;
      document.getElementById("current-streak").textContent = stats.currentStreak;
      document.getElementById("max-streak").textContent = stats.maxStreak;
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  function createGameBoard() {
    board.innerHTML = "";
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const tile = document.createElement("div");
        tile.id = r + "-" + c;
        tile.classList.add("tile");
        tile.innerText = "";
        board.appendChild(tile);
      }
    }
  }

  function createKeyboard() {
    const keyboardLayout = [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["Enter", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
    ];
    keyboard.innerHTML = "";
    for (let row of keyboardLayout) {
      const keyboardRow = document.createElement("div");
      keyboardRow.classList.add("keyboard-row");
      for (let key of row) {
        const keyTile = document.createElement("div");
        keyTile.innerText = key;
        keyTile.classList.add(key === "Enter" ? "enter-key-tile" : key === "⌫" ? "backspace-key-tile" : "key-tile");
        keyTile.id = key === "⌫" ? "Backspace" : key;
        keyTile.addEventListener("click", handleKeyClick);
        keyboardRow.appendChild(keyTile);
      }
      keyboard.appendChild(keyboardRow);
    }
  }

  function resetKeyboard() {
    const keys = document.querySelectorAll(".key-tile, .enter-key-tile, .backspace-key-tile");
    keys.forEach((key) => {
      key.classList.remove("correct", "present", "absent");
    });
  }

  function handleKeyClick(e) {
    const key = e.target.innerText;
    if (key === "Enter") submitGuess();
    else if (key === "⌫") deleteLetter();
    else addLetter(key);
  }

  function addLetter(letter) {
    if (gameOver || col >= width) return;
    const currTile = document.getElementById(row + "-" + col);
    if (currTile.innerText === "") {
      currTile.innerText = letter;
      col++;
      currentWord += letter;
    }
  }

  function deleteLetter() {
    if (gameOver || col <= 0) return;
    col--;
    const currTile = document.getElementById(row + "-" + col);
    currTile.innerText = "";
    currentWord = currentWord.slice(0, -1);
  }

  async function submitGuess() {
    if (gameOver || col < width) {
      showToast("Not enough letters");
      shakeRow();
      return;
    }

    try {
      const response = await fetch(`/api/game/${gameId}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: currentWord })
      });
      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Error submitting guess");
        if (data.error === "Not in word list") shakeRow();
        return;
      }

      updateBoard(data.result);

      if (data.completed) {
        gameOver = true;
        setTimeout(() => showResultScreen(data.won, data.word), 1500);
      } else {
        row++;
        col = 0;
        currentWord = "";
      }
    } catch (error) {
      console.error("Error submitting guess:", error);
      showToast("Error submitting guess");
    }
  }

  function updateBoard(result) {
    for (let c = 0; c < width; c++) {
      const currTile = document.getElementById(row + "-" + c);
      const letter = currTile.innerText;
      const status = result[c].status;
      setTimeout(() => {
        currTile.classList.add(status);
        const keyTile = document.getElementById(letter);
        if (keyTile) {
          if (status === "correct") {
            keyTile.classList.remove("present", "absent");
            keyTile.classList.add("correct");
          } else if (status === "present" && !keyTile.classList.contains("correct")) {
            keyTile.classList.remove("absent");
            keyTile.classList.add("present");
          } else if (status === "absent" && !keyTile.classList.contains("correct") && !keyTile.classList.contains("present")) {
            keyTile.classList.add("absent");
          }
        }
      }, c * 200);
    }
  }

  function shakeRow() {
    for (let c = 0; c < width; c++) {
      const tile = document.getElementById(row + "-" + c);
      tile.classList.add("shake");
      setTimeout(() => tile.classList.remove("shake"), 500);
    }
  }

  async function startGame() {
    try {
      const response = await fetch("/api/game/new");
      const data = await response.json();
      gameId = data.gameId;
      row = 0;
      col = 0;
      gameOver = false;
      currentWord = "";
      createGameBoard();
      resetKeyboard();
      message.innerText = "";
      showGameScreen();
      document.addEventListener("keydown", handleKeyDown);
    } catch (error) {
      console.error("Error starting game:", error);
      showToast("Error starting game");
    }
  }

  function handleKeyDown(e) {
    if (gameOver) return;
    if (e.key === "Enter") submitGuess();
    else if (e.key === "Backspace") deleteLetter();
    else if (/^[a-zA-Z]$/.test(e.key)) addLetter(e.key.toUpperCase());
  }

  function showResultScreen(won, word) {
    const resultTitle = document.getElementById("result-title");
    const resultMessage = document.getElementById("result-message");
    const wordReveal = document.getElementById("word-reveal");
    resultTitle.innerText = won ? "Congratulations!" : "Game Over";
    resultMessage.innerText = won ? `You guessed the word in ${row + 1} ${row === 0 ? "try" : "tries"}!` : "Better luck next time!";
    wordReveal.innerText = `The word was: ${word}`;
    gameScreen.style.display = "none";
    resultScreen.style.display = "block";
    document.removeEventListener("keydown", handleKeyDown);
    loadStats();
  }

  function showHomeScreen() {
    homeScreen.style.display = "block";
    gameScreen.style.display = "none";
    resultScreen.style.display = "none";
    statsScreen.style.display = "none";
    loginScreen.style.display = "none";
    registerScreen.style.display = "none";
  }

  function showGameScreen() {
    homeScreen.style.display = "none";
    gameScreen.style.display = "block";
    resultScreen.style.display = "none";
    statsScreen.style.display = "none";
    loginScreen.style.display = "none";
    registerScreen.style.display = "none";
  }

  function showStatsScreen() {
    homeScreen.style.display = "none";
    gameScreen.style.display = "none";
    resultScreen.style.display = "none";
    statsScreen.style.display = "block";
    loginScreen.style.display = "none";
    registerScreen.style.display = "none";
  }

  function hideStatsScreen() {
    statsScreen.style.display = "none";
    if (gameOver) resultScreen.style.display = "block";
    else if (gameId) gameScreen.style.display = "block";
    else homeScreen.style.display = "block";
  }

  function showLoginScreen() {
    homeScreen.style.display = "none";
    gameScreen.style.display = "none";
    resultScreen.style.display = "none";
    statsScreen.style.display = "none";
    loginScreen.style.display = "block";
    registerScreen.style.display = "none";
  }

  function hideLoginScreen() {
    loginScreen.style.display = "none";
    homeScreen.style.display = "block";
  }

  function showRegisterScreen() {
    homeScreen.style.display = "none";
    gameScreen.style.display = "none";
    resultScreen.style.display = "none";
    statsScreen.style.display = "none";
    loginScreen.style.display = "none";
    registerScreen.style.display = "block";
  }

  function hideRegisterScreen() {
    registerScreen.style.display = "none";
    homeScreen.style.display = "block";
  }

  async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    if (!username || !password) {
      showToast("Please enter both username and password");
      return;
    }
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || "Login failed");
        return;
      }
      showToast(`Welcome back, ${data.username}!`);
      loginForm.reset();
      hideLoginScreen();
      checkUserStatus();
      loadStats();
    } catch (error) {
      console.error("Error logging in:", error);
      showToast("Error logging in");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById("register-username").value.trim();
    const password = document.getElementById("register-password").value;
    if (!username || !password) {
      showToast("Please enter both username and password");
      return;
    }
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || "Registration failed");
        return;
      }
      showToast(`Welcome, ${data.username}!`);
      registerForm.reset();
      hideRegisterScreen();
      checkUserStatus();
      loadStats();
    } catch (error) {
      console.error("Error registering:", error);
      showToast("Error registering");
    }
  }

  async function logout() {
    try {
      const response = await fetch("/api/logout", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || "Logout failed");
        return;
      }
      showToast("Logged out successfully");
      checkUserStatus();
      loadStats();
    } catch (error) {
      console.error("Error logging out:", error);
      showToast("Error logging out");
    }
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }
});
