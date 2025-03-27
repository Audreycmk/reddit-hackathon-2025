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
    const [votes, setVotes] = useState<number[]>([0, 0, 0, 0]); // Track votes for each answer

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

    // Handle answer selection and voting
    const handleAnswerClick = (selectedAnswer: string, answerIndex: number) => {
      if (gameEnded) return;

      // Increment the vote for the selected answer
      setVotes((prevVotes) => {
        const newVotes = [...prevVotes];
        newVotes[answerIndex] += 1;
        return newVotes;
      });

      // Move to next question after voting
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

    // Function to calculate the vote percentage
    const calculateVotePercentage = (index: number) => {
      const totalVotes = votes.reduce((sum, vote) => sum + vote, 0);
      return totalVotes > 0 ? ((votes[index] / totalVotes) * 100).toFixed(2) : "0.00";
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
              url={"https://preview.redd.it/my-son-is-at-a-firefighting-display-could-you-remove-the-v0-qndetxb6utsb1.jpg?auto=webp&s=d3ce2b6a86cd3fbb56515ace6fcb720aca5aa159"}
              imageWidth={300}
              imageHeight={200}
              description="Meme preview"
            />
            <text size="large" weight="bold" color="#555555">
              Guess the top-voted answer!
            </text>
            <button appearance="primary" onPress={startGame} size="large">
              Start Game
            </button>
          </vstack>
        ) : gameEnded ? (
          <vstack gap="medium" alignment="center middle">
            <text size="xxlarge" weight="bold" color="#FF4500">
              Game Over! 🎉
            </text>
            <text size="xlarge" weight="bold" color="#555555">
              Your Score: {score}/{memes.length}
            </text>
            <vstack gap="medium" width="85%">
              <button appearance="primary" onPress={postScoreToComments} size="large">
                Flex My Score!
              </button>
              <button appearance="primary" onPress={startGame} size="large">
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
              {answers.map((answer, index) => (
                <hstack key={index.toString()} gap="small" width="100%" alignment="center middle">
                  <button 
                    appearance="primary"
                    onPress={() => handleAnswerClick(answer, index)}
                    size="small"
                    width="35%"
                  >
                    {answer}
                  </button>
                  <text size="small" color="#555555">
                    {calculateVotePercentage(index)}% votes
                  </text>
                </hstack>
              ))}
            </vstack>
          </vstack>
        )}
      </vstack>
    );
  },
});

export default Devvit;