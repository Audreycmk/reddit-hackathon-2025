import { Devvit, useState } from "@devvit/public-api";

Devvit.configure({
  redditAPI: true, // Enable Reddit API
});

// List of memes with image URLs
const memes = [
  {
    question: "Rock Paper Scissors. Guess who won?",
    image: "https://i.redd.it/8csl1hc8udpe1.png", 
    correct: "Cops beat rockstars 🎸🚓",
    wrong: [
      "It's a draw 🤷‍♂️",
      "Neighbour wins 😏 🤌 !!! ",
      "Rock: I'm a rock, I don't care 🪨",
    ],
  },
  {
    question: "Heart is a heart! (Dog's butt shave)",
    image: "https://i.redd.it/xexx7e24tcqe1.jpeg",
    correct: "Dog got OnlyFans fame 🍑💕",
    wrong: [
      "Groomer followed instructions 🐶",
      "He found his missing piece 👉👌",
      "Get the dog a lawyer!!! 🧑‍⚖️",
    ],
  },
  {
    question: "Buddha, what makes us human?",
    image: "https://i.redd.it/uv9mongn7qqe1.png", 
    correct: "Selecting traffic lights 🧑‍💻🚦🚥",
    wrong: [
      "But master, they all look right 🤯",
      "Hackers: I write scripts 🤓👨‍💻",
      "Overthinking 🧘‍♂️",
    ],
  },
  {
    question: "500kg iron vs. 500kg feathers",
    image: "https://i.redd.it/mykhhex7vfqe1.jpeg",
    correct: "Bro I need that tutorial 🏋️‍♂️🙌🏻",
    wrong: [
      "Same weight 🤓😎",
      "Bird: 500 kg feathers??? 💀🐦",
      "Don't ask. I don't do gym 🤷‍♂️",
    ],
  },
  {
    question: "What screams 'I'm insecure'?",
    image: "https://i.redd.it/mm9qirb0irqe1.png",
    correct: "I'm old...💀🪦",
    wrong: [
      "Wait, they don\’t all have that? 🤔",
      "Neh. My password is password 😎",
      "I'm not insecure, I'm just shy 🥺",
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
      <vstack 
        height="100%" 
        width="100%" 
        gap="medium" 
        alignment="center middle"
        padding="medium"
        backgroundColor="#FFEEF2"
      >
        {!gameStarted ? (
          <vstack gap="medium" alignment="center middle">
            <vstack cornerRadius="full" padding="medium" backgroundColor="#FF4500">
              <text size="xxlarge" weight="bold" color="white">
                MEME QUIZ CHALLENGE
              </text>
            </vstack>
            <image 
              url={memes[0].image}
              imageWidth={300}
              imageHeight={200}
              description="Meme preview"
            />
            <text size="large" weight="bold" color="#1A1A1B">
              Can you guess these meme scenarios?
            </text>
            <button appearance="primary" onPress={startGame} size="small">
              Start Game
            </button>
          </vstack>
        ) : gameEnded ? (
          <vstack gap="medium" alignment="center middle">
            <text size="xxlarge" weight="bold" color="#FF4500">
              Game Over! 🎉
            </text>
            <text size="xlarge" weight="bold">
              Your Score: {score}/{memes.length}
            </text>
            <vstack gap="medium" width="80%">
              <button appearance="primary" onPress={postScoreToComments} size="small">
                Flex My Score
              </button>
              <button appearance="primary" onPress={startGame} size="small">
                Play Again
              </button>
            </vstack>
          </vstack>
        ) : (
          <vstack gap="medium" width="90%" alignment="center middle">
            <text size="xlarge" weight="bold" color="#1A1A1B">
              {memes[questionIndex].question}
            </text>
            <image 
              url={memes[questionIndex].image}
              imageWidth={300}
              imageHeight={250}
              description="Quiz image"
            />
            <vstack gap="small" width="100%">
              <hstack gap="small" width="100%" alignment="center middle">
                <button 
                  appearance="primary"
                  onPress={() => handleAnswerClick(answers[0])}
                  size="small"
                  width="35%"
                >
                  {answers[0]}
                </button>
                <button 
                  appearance="primary"
                  onPress={() => handleAnswerClick(answers[1])}
                  size="small"
                  width="35%"
                >
                  {answers[1]}
                </button>
              </hstack>
              <hstack gap="small" width="100%" alignment="center middle">
                <button 
                  appearance="primary"
                  onPress={() => handleAnswerClick(answers[2])}
                  size="small"
                  width="35%"
                >
                  {answers[2]}
                </button>
                <button 
                  appearance="primary"
                  onPress={() => handleAnswerClick(answers[3])}
                  size="small"
                  width="35%"
                >
                  {answers[3]}
                </button>
              </hstack>
            </vstack>
          </vstack>
        )}
      </vstack>
    );
  },
});

export default Devvit;