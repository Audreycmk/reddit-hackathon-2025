import { Devvit } from "@devvit/public-api";

Devvit.configure({
  redditAPI: true,
  redis: true,
});

interface MemeQuestion {
  question: string;
  image: string;
  answers: string[];
}

const memes: MemeQuestion[] = [
  {
    question: "Rock Paper Scissors. Guess who won?",
    image: "https://i.redd.it/8csl1hc8udpe1.png",
    answers: [
      "Cops beat rockstars 🎸🚓",
      "It's a draw 🤷‍♂️",
      "Neighbour wins 😏 🤌 !!! ",
      "Rock: I'm a rock, I don't care 🪨"
    ],
  },
  {
    question: "Heart is a heart!",
    image: "https://i.redd.it/xexx7e24tcqe1.jpeg",
    answers: [
      "Dog got OnlyFans fame 🍑💕",
      "Groomer followed instructions 🐶",
      "He found his missing piece 👉👌",
      "Get the dog a lawyer!!! 🧑‍⚖️"
    ],
  },
  {
    question: "Buddha, what makes us human?",
    image: "https://i.redd.it/uv9mongn7qqe1.png", 
    answers: [ 
      "Selecting traffic lights 🧑‍💻🚦🚥",
      "But master, they all look right 🤯",
      "Hackers: I write scripts 🤓👨‍💻",
      "Overthinking 🧘‍♂️",
    ],
  },
  {
    question: "500kg iron vs. 500kg feathers",
    image: "https://i.redd.it/mykhhex7vfqe1.jpeg",
    answers: [ 
      "Bro I need that tutorial 🏋️‍♂️🙌🏻",
      "Same weight 🤓😎",
      "Bird: 500 kg feathers??? 💀🐦",
      "Don't ask. I don't do gym 🤷‍♂️",
    ],
  },
  {
    question: "What screams 'I'm insecure'?",
    image: "https://i.redd.it/mm9qirb0irqe1.png",
    answers: [ 
       "I'm old...💀🪦",
      "Wait, they don't all have that? 🤔",
      "Neh. My password is password 😎",
      "I'm not insecure, I'm just shy 🥺",
    ],
  }
];

Devvit.addCustomPostType({
  name: "Image Quiz Game",
  height: "tall",
  render: (context) => {
    const [score, setScore] = context.useState(0);
    const [questionIndex, setQuestionIndex] = context.useState(0);
    const [answers, setAnswers] = context.useState<string[]>([]);
    const [votes, setVotes] = context.useState<number[]>([0, 0, 0, 0]);
    const [gameStarted, setGameStarted] = context.useState(false);
    const [gameEnded, setGameEnded] = context.useState(false);
    const [hasVoted, setHasVoted] = context.useState(false);
    const [showResults, setShowResults] = context.useState(false);
    const [selectedAnswerIndex, setSelectedAnswerIndex] = context.useState<number>(-1);
    
    const postId = context.postId;
    const reddit = context.reddit;

    const getVotesKey = () => `votes:${postId}:${questionIndex}`;

    const loadVotes = async () => {
      try {
        const votesKey = getVotesKey();
        const storedVotes = await context.redis.get(votesKey);
        if (storedVotes) {
          const parsedVotes = JSON.parse(storedVotes);
          setVotes(parsedVotes);
          return parsedVotes;
        } else {
          const initialVotes = [0, 0, 0, 0];
          await context.redis.set(votesKey, JSON.stringify(initialVotes));
          setVotes(initialVotes);
          return initialVotes;
        }
      } catch (error) {
        console.error("Error loading votes:", error);
        return [0, 0, 0, 0];
      }
    };

    const startGame = async () => {
      setScore(0);
      setGameStarted(true);
      setGameEnded(false);
      setQuestionIndex(0);
      setShowResults(false);
      setHasVoted(false);
      setSelectedAnswerIndex(-1);
      await loadNewQuestion(0);
    };

    const loadNewQuestion = async (index: number) => {
      if (index >= memes.length) {
        endGame();
        return;
      }

      const selectedQuestion = memes[index];
      const shuffledAnswers = [...selectedQuestion.answers].sort(() => Math.random() - 0.5);
      
      setQuestionIndex(index);
      setAnswers(shuffledAnswers);
      setShowResults(false);
      setHasVoted(false);
      setSelectedAnswerIndex(-1);
      await loadVotes();
    };

    const handleVote = async (answerIndex: number) => {
      if (hasVoted) return;
      
      try {
        const votesKey = getVotesKey();
        const currentVotes = await loadVotes();
        const newVotes = [...currentVotes];
        newVotes[answerIndex] += 1;

        const txn = await context.redis.watch(votesKey);
        await txn.multi();
        await txn.set(votesKey, JSON.stringify(newVotes));
        const results = await txn.exec();
        
        if (results === null) {
          context.ui.showToast({
            text: "Vote failed, please try again",
            appearance: "neutral",
          });
          return;
        }
        
        setVotes(newVotes);
        setSelectedAnswerIndex(answerIndex);
        setHasVoted(true);
        setShowResults(true);
      } catch (error) {
        console.error("Error handling vote:", error);
        context.ui.showToast({
          text: "Failed to register vote",
          appearance: "neutral",
        });
      }
    };

    const calculateVotePercentage = (index: number): string => {
      const totalVotes = votes.reduce((sum, count) => sum + count, 0);
      return totalVotes > 0 ? `${Math.round((votes[index] / totalVotes) * 100)}%` : "0%";
    };

    const proceedToNextQuestion = async () => {
      const maxVotes = Math.max(...votes);
      const winningIndices = votes
        .map((count, idx) => count === maxVotes ? idx : -1)
        .filter(idx => idx !== -1);

      if (winningIndices.includes(selectedAnswerIndex)) {
        setScore(prev => prev + 1);
      }
      
      if (questionIndex >= memes.length - 1) {
        endGame();
      } else {
        await loadNewQuestion(questionIndex + 1);
      }
    };

    const endGame = () => {
      setGameEnded(true);
      setShowResults(false);
    };

    const postScoreToComments = async () => {
      if (!postId || !reddit) return;

      const performanceRating = 
        score === memes.length ? '🏆 Perfect Score!' :
        score >= Math.ceil(memes.length * 0.75) ? '🎉 Great Job!' :
        score >= Math.ceil(memes.length * 0.5) ? '👍 Good Try!' :
        '🤔 Better Luck Next Time!';

      try {
        await reddit.submitComment({
          id: postId,
          text: `I scored ${score}/${memes.length} in the Meme Quiz! ${performanceRating}`,
        });
        context.ui.showToast({
          text: "Score posted successfully!",
          appearance: "success",
        });
      } catch (error) {
        console.error("Error posting score:", error);
        context.ui.showToast({
          text: "Failed to post score",
          appearance: "neutral",
        });
      }
    };

    return (
      <vstack height="100%" width="100%" gap="medium" alignment="center middle" padding="medium" backgroundColor="#FFEEF2">
        {!gameStarted ? (
          <vstack gap="medium" alignment="center middle">
            <vstack cornerRadius="full" padding="medium" backgroundColor="#FF4500">
              <text size="xxlarge" weight="bold" color="white">MEME QUIZ CHALLENGE</text>
            </vstack>
            <image url={memes[0].image} imageWidth={300} imageHeight={200} />
            <text size="large" color="#000000">Can you guess the most popular answers?</text>
            <button onPress={startGame} appearance="primary">
              Start Game
            </button>
          </vstack>
        ) : gameEnded ? (
          <vstack gap="medium" alignment="center middle">
            <text size="xxlarge" weight="bold" color="#FF4500">Game Over! 🎉</text>
            <text size="xlarge" color="#000000">Your Score: {score}/{memes.length}</text>
            <button onPress={postScoreToComments} appearance="primary">
              Share Score
            </button>
            <button onPress={startGame} appearance="primary">
              Play Again
            </button>
          </vstack>
        ) : showResults ? (
          <vstack gap="medium" width="90%" alignment="center middle">
            <text size="xlarge" weight="bold" color="#000000">{memes[questionIndex].question}</text>
            <image url={memes[questionIndex].image} imageWidth={300} imageHeight={250} />
            <vstack gap="small" width="100%">
              {answers.map((answer, index) => (
                <hstack key={index.toString()} gap="medium" alignment="center" width="100%">
                  <text width="80%" size="medium" color="#000000">{answer}</text>
                  <text width="20%" size="medium" weight="bold" color="#000000">
                    {calculateVotePercentage(index)}
                  </text>
                </hstack>
              ))}
            </vstack>
            <button onPress={proceedToNextQuestion} appearance="primary">
              Next Question
            </button>
          </vstack>
        ) : (
          <vstack gap="medium" width="90%" alignment="center middle">
            <text size="xlarge" weight="bold" color="#000000">{memes[questionIndex].question}</text>
            <image url={memes[questionIndex].image} imageWidth={300} imageHeight={250} />
            <vstack gap="small" width="100%">
              {answers.map((answer, index) => (
                <button
                  key={index.toString()}
                  onPress={() => handleVote(index)}
                  appearance="primary"
                  width="100%"
                >
                  {answer}
                </button>
              ))}
            </vstack>
          </vstack>
        )}
      </vstack>
    );
  },
});

export default Devvit;