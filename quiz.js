let gamerules;
let quizData = [];
let rateQuizData = [];
let usedQuestions = [];

let currentQuestion = null;
let currentIndex = 0;
let lives = 0;
let score = 0;
let correctAnswers = 0;

let timer;
let timeLeft;

const questionTextElement = document.querySelector(".question_text");
const hpElement = document.querySelector(".hp");
const questionIdElement = document.querySelector(".question_id");
const timeTextElement = document.querySelector(".time_text");
const answerButtons = document.querySelectorAll(".answer_choices");

async function loadData() {
    gamerules = await loadJSON('gamerule.json');
    const quiz = await loadJSON('quiz.json');
    quizData = quiz.quizData;
    rateQuizData = quiz.rateQuizData;
    startGame();
}

async function loadJSON(url) {
    const response = await fetch(url);
    return response.json();
}

function startGame() {
    currentIndex = 0;
    lives = gamerules.lives;
    score = 0;
    correctAnswers = 0;
    usedQuestions = [];
    loadNextQuestion();
}

function loadNextQuestion() {
    if (currentIndex >= gamerules.questionCount && quizData.length === 0) return endGame();

    const isRare = Math.random() < gamerules.rareQuestionChance || quizData.length === 0;
    let questionPool = isRare ? rateQuizData : quizData;

    if (questionPool.length === 0) questionPool = isRare ? quizData : rateQuizData;

    const availableQuestions = questionPool.filter((_, i) =>
        !usedQuestions.includes(i + '_' + (isRare ? 'rare' : 'regular'))
    );

    if (availableQuestions.length === 0) return loadNextQuestion();

    const index = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions[index];

    const questionIndex = (isRare ? rateQuizData : quizData).indexOf(currentQuestion);
    usedQuestions.push(questionIndex + '_' + (isRare ? 'rare' : 'regular'));

    showQuestion(currentQuestion, isRare);
}

function showQuestion(question, isRare) {
    clearTimeout(timer);
    resetAnswerButtons();

    timeLeft = gamerules.timeLimit;
    updateTimerDisplay();
    timer = setInterval(handleTimeTick, 1000);

    questionTextElement.classList.remove("text_animation_in", "text_animation_out");
    void questionTextElement.offsetWidth;
    questionTextElement.classList.add("text_animation_in");
    questionTextElement.textContent = question.question;

    questionIdElement.textContent = `Question: ${currentIndex + 1}/${gamerules.questionCount}`;
    hpElement.textContent = "Hp: " + "❤️".repeat(lives) + "🖤".repeat(gamerules.lives - lives);

    answerButtons.forEach((btn, idx) => {
        const b = btn.querySelector("b");
        b.textContent = question.answers[idx];
        btn.disabled = false;
        btn.classList.remove("correct", "incorrect");
        btn.onclick = () => handleAnswer(idx + 1, question.correct, isRare);
    });
}

function resetAnswerButtons() {
    answerButtons.forEach(btn => {
        btn.classList.remove("correct", "incorrect");
        btn.disabled = false;
    });
}

function updateTimerDisplay() {
    const min = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const sec = String(timeLeft % 60).padStart(2, '0');
    timeTextElement.textContent = `${min}:${sec}`;
}

function handleTimeTick() {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
        clearInterval(timer);
        lives--;
        highlightCorrect(currentQuestion.correct);
        endTurn(false);
    }
}

function handleAnswer(selected, correct, isRare) {
    clearInterval(timer);

    const isCorrect = selected === correct;

    answerButtons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx + 1 === selected) btn.classList.add(isCorrect ? "correct" : "incorrect");
        if (idx + 1 === correct) btn.classList.add("correct");
    });

    if (isCorrect) {
        score += isRare ? gamerules.rareScore : gamerules.regularScore;
        correctAnswers++;
    } else {
        lives--;
    }

    endTurn(isCorrect);
}

function highlightCorrect(correctIndex) {
    answerButtons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx + 1 === correctIndex) btn.classList.add("correct");
    });
}

function endTurn(isCorrect) {
    questionTextElement.classList.remove("text_animation_in");
    questionTextElement.classList.add("text_animation_out");

    setTimeout(() => {
        if (lives <= 0 || currentIndex + 1 >= gamerules.questionCount) {
            endGame();
        } else {
            currentIndex++;
            loadNextQuestion();
        }
    }, 1500);
}

function endGame() {
    clearInterval(timer);
    const query = `main.html?score=${score}&lives=${lives}&correctAnswers=${correctAnswers}`;
    window.location.href = query;
}

loadData();
