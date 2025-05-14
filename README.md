# Wordle Full-Stack

A full-stack implementation of the popular word-guessing game Wordle, built with HTML, CSS, JavaScript, Express, and MongoDB.

## Features

- Play the classic Wordle game with 6 attempts to guess a 5-letter word
- User registration and login to track game statistics
- Statistics tracking including games played, win percentage, current streak, and max streak
- Responsive design for desktop and mobile devices

## Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Create a `.env` file in the root directory with the following variables:
   \`\`\`
   MONGODB_URI=mongodb://localhost:27017/wordle
   SESSION_SECRET=your_session_secret_here
   PORT=3000
   \`\`\`
4. Start the server:
   \`\`\`
   npm start
   \`\`\`
5. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. Click "Play Game" to start a new game
2. Try to guess the 5-letter word in 6 attempts
3. After each guess, the tiles will change color:
   - Green: The letter is correct and in the right position
   - Yellow: The letter is in the word but in the wrong position
   - Gray: The letter is not in the word
4. Use the on-screen keyboard or your physical keyboard to enter letters
5. Press Enter to submit your guess
6. If you win or lose, you'll see the result screen with the option to play again

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB
- Session Management: express-session, connect-mongo

## License

MIT
