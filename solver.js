let circles = document.getElementsByClassName("circle");
let colourResults = new Map();
colourResults.set("white", "");
colourResults.set("green", "g");
colourResults.set("yellow", "y");
colourResults.set("grey", "-");

let activeColour = "white";
let activeRow = -1;
let currentResult = ["", "", "", "", ""];
let hardMode = false;
let currentGuess = "CRANE";
let solved = false;
//Read the data files and populate lists for use in the solver;
let wordList = [];
let untouchedWordList = []; //a version of the wordList that never gets deleted from, to make the custom start more consistent
let answerList = [];
let resultsList = [];

fetch("wordle_guesses.txt")
  .then((response) => response.text())
  .then((data) => {
    wordList = data.split(" ").map((word) => word.toUpperCase());
  });

fetch("wordle_answers.txt")
  .then((response) => response.text())
  .then((data) => {
    answerList = data.split(" ").map((word) => word.toUpperCase());
    wordList.push(...answerList);
    untouchedWordList.push(...wordList);
  });

fetch("wordle_results.txt")
  .then((response) => response.text())
  .then((data) => {
    resultsList = data.split(" ");
  });

//Add an on-click function to each of the colour circles to make them the active colour
for (let i = 0; i < circles.length; i++) {
  let circle = circles[i];
  circle.addEventListener("click", function () {
    for (const ccl of circles) {
      ccl.classList.remove("active-circle");
    }
    circle.classList.add("active-circle");
    let circleId = circle.id;
    activeColour = circleId.slice(0, -3);
  });
}

/**
 * Outputs the activColour variable in a paragraph element
 * Purely for debugging, should not be run once the site is finished
 */
function displayActiveColour() {
  let displayDiv = document.getElementById("active-colour-display");
  displayDiv.innerHTML = "";
  let displayParagraph = document.createElement("p");
  let displayText = document.createTextNode(activeColour);
  displayParagraph.appendChild(displayText);
  //displayParagraph.style = "colour: "+activeColour;
  displayDiv.appendChild(displayParagraph);
}
/**
 * Takes a word as input and displays it, one letter at a time, on the current row
 * The current row is defined by the activeRow variable
 * @param {string} word
 */
function printWordToRow(word) {
  let rowId = "row" + String(activeRow);

  let rowToWriteTo = document.getElementById(rowId);

  for (let i = 0; i < 5; i++) {
    setTimeout(function () {
      let square = rowToWriteTo.children[i];
      square.innerText = word[i];
      square.classList.add("letter-reveal");
    }, 300 * (i + 1));
  }
}

function makeRowClickable() {
  if (activeRow > 0) {
    let lastRowId = "row" + String(activeRow - 1);
    let lastRow = document.getElementById(lastRowId);
    for (let i = 0; i < 5; i++) {
      let square = lastRow.children[i];
      square.removeEventListener("click", square._handler);
      delete square._handler;
    }
    hardModeToggle.disabled = true;
  }
  if (solved == false) {
    let currentRowId = "row" + String(activeRow);
    let currentRow = document.getElementById(currentRowId);
    for (let i = 0; i < 5; i++) {
      let square = currentRow.children[i];
      square._handler = makeUpdateColourHandler(square, i);
      square.addEventListener("click", square._handler);
    }
  }
}
/**
 * Update the colour of the clicked square
 * @param {Element} square
 * @param {Number} index
 */
function updateColour(square, index) {
  square.classList.remove("green-square");
  square.classList.remove("yellow-square");
  square.classList.remove("grey-square");
  square.classList.add(activeColour + "-square");
  currentResult[index] = colourResults.get(activeColour);
}

function makeUpdateColourHandler(square, index) {
  return function () {
    updateColour(square, index);
  };
}

function showThinkingOverlay() {
  document.getElementById("thinkingOverlay").classList.remove("d-none");
}

function hideThinkingOverlay() {
  document.getElementById("thinkingOverlay").classList.add("d-none");
}

function thinkThenEvaluate() {
  if (currentResult.join("").length == 5) {
    showThinkingOverlay();
    setTimeout(evaluateWord, 50);
  }
}

function evaluateWord() {
  result = currentResult.join("");
  let hardLetters = [];
  let hardRes = "-----";
  if (result.length == 5) {
    if (result == "ggggg") {
      hideThinkingOverlay();
      solved = true;
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6aaa64", "#c9b458", "#787c7e"],
      });
    } else {
      let i = 0;
      while (i < answerList.length) {
        let target = answerList[i];
        let loopResult = compareWords(currentGuess, target);
        if (loopResult != result) {
          answerList.splice(i, 1);
        } else {
          i++;
        }
      }
      if (hardMode == true) {
        hardLetters = [];
        for (let i = 0; i < 5; i++) {
          if (result[i] == "g" || result[i] == "y") {
            hardLetters.push(currentGuess[i]);
            if (result[i] == "g") {
              hardRes =
                hardRes.slice(0, i) + currentGuess[i] + hardRes.slice(i + 1);
            }
          }
        }
        let j = 0;
        while (j < wordList.length) {
          let w = wordList[j];
          let valid = true;
          for (let i = 0; i < 5; i++) {
            if (result[i] == "g") {
              if (w[i] != currentGuess[i]) {
                valid = false;
                break;
              } else if (
                countCharInWord(w, currentGuess[i]) <
                countCharInArray(hardLetters, currentGuess[i])
              ) {
                valid = false;
                break;
              }
            } else if (result[i] == "y") {
              if (
                countCharInWord(w, currentGuess[i]) <
                countCharInArray(hardLetters, currentGuess[i])
              ) {
                valid = false;
                break;
              }
            }
          }
          if (valid == true) {
            j++;
          } else {
            wordList.splice(j, 1);
          }
        }
      }
      if (answerList.length == 1) {
        currentGuess = answerList[0];
        hideThinkingOverlay();
        updateRow();
      } else if (answerList.length == 0) {
        solved = true;
        alert(
          "I can't find a solution. Either you've made a mistake somewhere, or something's wrong with my code..."
        );
        submitButton.removeEventListener("click",thinkThenEvaluate);
        submitButton.addEventListener("click",function(){window.location.reload();})
        submitButton.innerText="Reload page";
        hideThinkingOverlay();
      } else {
        currentGuess = bestGuess(hardLetters, hardRes);
        hideThinkingOverlay();
        updateRow();
      }
    }
  }
}

/**
 * Function to count how many times a char c occurs in a word
 * @param {string} word
 * @param {char} c
 */
function countCharInWord(word, c) {
  let count = 0;
  for (let i = 0; i < word.length; i++) {
    if (word[i] == c) {
      count++;
    }
  }
  return count;
}
/**
 *
 * @param {char[]} arr
 * @param {char} c
 */
function countCharInArray(arr, c) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] == c) {
      count++;
    }
  }
  return count;
}

/**
 * Function that compares all possible guesses to all possible answers to find the best one
 * The parameters will be blank outside of hard mode and are only used in hard mode
 * @param {char[]} hardLetters
 * @param {string} hardResult
 */
function bestGuess(hardLetters, hardResult) {
  let minimax = Number.MAX_VALUE;
  let bestGuesses = [];
  for (const word of wordList) {
    let valid = true;
    if (hardMode == true) {
      for (let i = 0; i < 5; i++) {
        let l = word[i];
        if (hardResult[i] != "-" && hardResult[i] != l) {
          valid = false;
          break;
        }
        if (countCharInArray(hardLetters, l) > countCharInWord(word, l)) {
          valid = false;
          break;
        }
      }
    }
    if (valid == false) {
      continue;
    }
    let maxScore = 0;
    let scoreMap = new Map();
    for (const res of resultsList) {
      scoreMap.set(res, 0);
    }
    for (const a of answerList) {
      let result = compareWords(word, a);
      scoreMap.set(result, scoreMap.get(result) + 1);
      if (scoreMap.get(result) > maxScore) {
        maxScore = scoreMap.get(result);
      }
    }
    if (maxScore < minimax) {
      minimax = maxScore;
      bestGuesses = [word];
    } else if (maxScore == minimax) {
      bestGuesses.push(word);
    }
  }
  let guess = bestGuesses[0];
  for (const option of bestGuesses) {
    if (answerList.includes(option)) {
      guess = option;
      break;
    }
  }
  return guess;
}

/**
 *
 * @param {string} guess
 * @param {string} target
 */
function compareWords(guess, target) {
  let result = "";
  let letterCounts = new Map();
  for (const c of target) {
    if (letterCounts.has(c)) {
      letterCounts.set(c, letterCounts.get(c) + 1);
    } else {
      letterCounts.set(c, 1);
    }
  }

  for (i = 0; i < 5; i++) {
    let c = guess[i];
    if (c == target[i]) {
      result += "g";
      letterCounts.set(c, letterCounts.get(c) - 1);
    } else if (
      target.includes(c) &&
      letterCounts.has(c) &&
      letterCounts.get(c) > 0
    ) {
      let isYellow = false;
      for (j = 0; j < 5; j++) {
        if (target[j] == c && guess[j] != target[j]) {
          isYellow = true;
          break;
        }
      }
      if (isYellow == true) {
        result += "y";
        letterCounts.set(c, letterCounts.get(c) - 1);
      } else {
        result += "-";
      }
    } else {
      result += "-";
    }
  }
  return result;
}

function updateRow() {
  if (activeRow < 5) {
    activeRow++;
    printWordToRow(currentGuess);
    makeRowClickable();
    currentResult = ["", "", "", "", ""];
  }
}

function customStart() {
  let customStartWord = document.getElementById("customStartTxt").value;
  if (untouchedWordList.includes(customStartWord.toUpperCase())) {
    let oldUrl = window.location.toString().split("#")[0];
    let newUrl = oldUrl + "#" + customStartWord;
    window.location.href = newUrl;
    window.location.reload();
  }
}

function saveHardModeToStorage(){
  localStorage.setItem("hardMode", JSON.stringify(hardMode));
}

function loadHardModeFromStorage(){
  storedHardMode = localStorage.getItem("hardMode");
  hardMode = JSON.parse(storedHardMode);
}

function updateHardMode() {
  hardMode = !hardMode
  saveHardModeToStorage();
}

if (window.location.hash != "") {
  let hash = window.location.hash.slice(1).toUpperCase();
  if (hash.length == 5) {
    currentGuess = hash;
  }
}

updateRow();

let submitButton = document.getElementById("submitBtn");
submitButton.addEventListener("click", thinkThenEvaluate);
let hardModeToggle = document.getElementById("hardModeToggle");
hardModeToggle.addEventListener("change", updateHardMode);
loadHardModeFromStorage();
if (hardMode){
  hardModeToggle.checked = true;
}
let customStartButton = document.getElementById("customStartBtn");
customStartButton.addEventListener("click", customStart);
