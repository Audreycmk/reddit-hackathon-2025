import { Devvit, useState } from "@devvit/public-api";

Devvit.configure({
  redditAPI: true, // Enable Reddit API
});

// List of memes with image URLs
const memes = [
  {
    question: "Rock Paper Scissors. Guess who won?",
    image: "https://i.redd.it/8csl1hc8udpe1.png", 
    correct: "Cops beat rockstars",
    wrong: [
      "Paper covers rock",
      "Scissors cut paper",
      "Tie goes to lizard",
    ],
  },
  {
    question: "Buddha, what makes us human?",
    image: "https://i.redd.it/uv9mongn7qqe1.png", 
    correct: "Selecting traffic lights",
    wrong: [
      "Opposable thumbs",
      "Self-awareness",
      "Credit card debt"
    ],
  },
  {
    question: "500kg iron vs. 500kg feathers",
    image: "https://i.redd.it/mykhhex7vfqe1.jpeg",
    correct: "Gym bro's ego shattered",
    wrong: [
      "Same weight, different volume",
      "Feathers stuck in throat",
      "Iron sold as NFT",
    ],
  },
  {
    question: "Heart is a heart! (Dog's butt shave)",
    image: "https://i.redd.it/xexx7e24tcqe1.jpeg",
    correct: "Dog got OnlyFans fame",
    wrong: [
      "Groomer followed instructions",
      "It's a birthmark",
      "Dog sued for copyright",
    ],
  },
  {
    question: "What screams 'I'm insecure'?",
    image: "https://i.redd.it/mm9qirb0irqe1.png",
    correct: "Posting 'I'm not insecure'",
    wrong: [
      "Oversized sunglasses",
      "Laughing too loud",
      "Flexing on LinkedIn"
    ],
  }
];


Devvit.addCustomPostType({
  name: "Image Quiz Game",
  height: "tall", // Using tall height to better accommodate images
  render: (context) => {
    const [score, setScore] = useState(0);
    const [questionIndex, setQuestionIndex] = useState<number>(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);

    const postId = context?.postId;
    const reddit = context?.reddit;

    // Function to start the game
    const startGame = () => {
      setScore(0);
      setGameStarted(true);
      setGameEnded(false);
      setQuestionIndex(0);
      loadNewQuestion(0);
    };

    // Load a new question
    const loadNewQuestion = (index: number) => {
      if (index >= memes.length) {
        endGame();
        return;
      }

      const selectedQuestion = memes[index];
      const shuffledAnswers = [...selectedQuestion.wrong, selectedQuestion.correct].sort(() => Math.random() - 0.5);

      setQuestionIndex(index);
      setAnswers(shuffledAnswers);
    };

    // Handle answer selection
    const handleAnswerClick = (selectedAnswer: string) => {
      if (gameEnded) return;

      const correctAnswer = memes[questionIndex].correct;

      if (selectedAnswer === correctAnswer) {
        setScore((prevScore) => prevScore + 1);
      }

      loadNewQuestion(questionIndex + 1);
    };

    // End the game
    const endGame = () => {
      setGameEnded(true);
    };

    // Post the score to the Reddit comments
    const postScoreToComments = async () => {
      if (!postId || !reddit) {
        console.error("Error: Missing postId or Reddit API");
        return;
      }

      const commentText = `I finished the Image Quiz Game with ${score} correct answers out of ${memes.length}! 🎉`;

      try {
        await reddit.submitComment({
          id: postId,
          text: commentText,
        });
        console.log("Score posted successfully!");
      } catch (error) {
        console.error("Error posting score to comments:", error);
      }
    };

    return (
      <vstack height="100%" width="100%" gap="medium" alignment="center middle">
        {!gameStarted ? (
          <>
            <text size="xxlarge" weight="bold">Image Quiz Game</text>
            <text size="medium">Identify what's shown in each image</text>
            <button appearance="primary" onPress={startGame}>
              Start Game
            </button>
          </>
        ) : gameEnded ? (
          <>
            <text size="xxlarge" weight="bold">Game Over! 🎉</text>
            <text size="xlarge">Your Score: {score}/{memes.length}</text>
            <vstack gap="small">
              <button appearance="primary" onPress={postScoreToComments}>
                Post My Score
              </button>
              <button appearance="primary" onPress={startGame}>
                Play Again
              </button>
            </vstack>
          </>
        ) : (
          <>
            <text size="large">{memes[questionIndex].question}</text>
            <image 
              url={memes[questionIndex].image} 
              imageWidth={300} //change img width
              imageHeight={250} 
              resizeMode="cover" 
              description="Quiz image"
            />
            <vstack gap="small" width="100%" alignment="center middle">
              {answers.map((answer, index) => (
                <button 
                  key={`${answer}-${index}`} 
                  appearance="primary" 
                  onPress={() => handleAnswerClick(answer)}
                  size="small"
                  width="30%"
                >
                  {answer}
                </button>
              ))}
            </vstack>
          </>
        )}
      </vstack>
    );
  },
});

export default Devvit;