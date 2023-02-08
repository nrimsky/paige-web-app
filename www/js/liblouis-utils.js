var initialInputText = document.querySelector("#initialInputText");
var translatedText = document.querySelector("#translated");

var PAIGE_CHARACTER_WAIT_TIME_MS = 100;

var MAX_LINE_LENGTH = 15;
var LINES_PER_PAGE = 5;

// For Paige Display pagination
var allPagesText = [];
var currentPage = 0;

function setupGradeButtons() {
  var radio1 = document.getElementById('radioGrade1');
  var radio2 = document.getElementById('radioGrade2');

  radio1.addEventListener('click', function () {
    onPaigeChange(initialInputText.value, false);
  });

  radio2.addEventListener('click', function () {
    onPaigeChange(initialInputText.value, false);
  });
}

function makeTextareaAutoScroll(textarea) {
  textarea.scrollTop = textarea.scrollHeight;
}

function goToNextPage() {
  if (currentPage < allPagesText.length - 1) {
    currentPage += 1;
    onPaigeChange(allPagesText[currentPage], false);
  }
}

function goToPreviousPage() {
  if (currentPage > 0) {
    currentPage -= 1;
    onPaigeChange(allPagesText[currentPage], false);
  }
}

function splitText(text, goToLastPage) {
  allPagesText[currentPage] = text; // Edit current page
  var newText = allPagesText.join("").replace(/\n/g, "");
  if (newText.replace(/\s+/g, '').length === 0) {
    currentPage = 0;
    allPagesText = [];
    return "";
  }
  var lines = [];
  for (var i = 0; i < newText.length; i += MAX_LINE_LENGTH) {
    lines.push(newText.substring(i, i + MAX_LINE_LENGTH));
  }
  var pages = [];
  for (var j = 0; j < lines.length; j += LINES_PER_PAGE) {
    pages.push(lines.slice(j, j + LINES_PER_PAGE).join("\n"));
  }
  allPagesText = pages;
  if (goToLastPage) {
    currentPage = allPagesText.length - 1;
  }
  return allPagesText[currentPage];
}


function onPaigeChange(newInput, goToLastPage) {
  makeTextareaAutoScroll(initialInputText);
  makeTextareaAutoScroll(translatedText);
  if (USES_PAIGE_DISPLAY) {
    newInput = splitText(newInput, goToLastPage);
  }
  initialInputText.value = newInput;
  var gradeValue = document.querySelector('input[name="grade"]:checked').value;
  var lines = newInput.split("\n");
  var translation = [];
  for (var i = 0; i < lines.length; i++) {
    translation.push(translateWithLiblouis(lines[i].replace("\n", ""), gradeValue));
  }
  translatedText.value = translation.join("\n");
}

function getAsciiFileName(AsciiBase10) {
  var AsciiBase16 = AsciiBase10.toString(16);
  var AsciiBase16FileName = AsciiBase16.toUpperCase();
  return AsciiBase16FileName;
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function formatAsBrf(text) {
  var newText = text.replace(/\n/g, "");
  var lines = [];
  var finalLines = [];
  for (var i = 0; i < newText.length; i += MAX_LINE_LENGTH) {
    lines.push(newText.substring(i, i + MAX_LINE_LENGTH));
  }
  for (var i = 0; i < lines.length; i += 1) {
    if (i !== 0 & i % LINES_PER_PAGE === 0) {
      finalLines.push("" + lines[i]);
    } else {
      finalLines.push(lines[i]);
    }
  }
  return finalLines.join("\n");
}

function saveTextInput() {
  if (IS_UI_DEMO) {
    download("braille.brf", formatAsBrf(translatedText.value));
  } else {
    console.log("Attempting to save Braille");
    var filename = translatedText.value.split("\n")[0].replace(/\s/g, '_');
    PAIGE_files_start_upload(filename + ".brf", formatAsBrf(initialInputText.value));
    function uploadTxt() {
      PAIGE_files_start_upload(filename + ".txt", translatedText.value);
    }
    setTimeout(uploadTxt, 5000);
  }
}

function clearTextInput() {
  initialInputText.value = "";
  translatedText.value = "";
  allPagesText = [];
  currentPage = 0;
  try {
    console.log("Attempting to clear");
    macro_command("ESP", "clear.gcode");
    SendDisableCommand();
  } catch (e) {
    console.error("Error sending clear command", e);
  }
}

// function asciiToUnicode(inp) {
//   var unicodeStr = "";
//   for (var i = 0; i < inp.length; i++) {
//     var val = asciiToUnicodeMap.get(inp[i]);
//     if (val) {
//       unicodeStr += asciiToUnicodeMap.get(inp[i]);
//     }
//   }
//   return unicodeStr;
// }

function printToBraille(tableNames, inputStr) {
  return liblouis.translateString(tableNames, inputStr);
}

function brailleToPrint(tableNames, inputStr) {
  return liblouis.backTranslateString(tableNames, inputStr);
}

function updateTextFromEnglishFileUpload(text) {
  var gradeValue = document.querySelector('input[name="grade"]:checked').value;
  var tableNames = "en-ueb-g1.ctb";
  if (gradeValue === '2') {
    tableNames = "en-ueb-g2.ctb";
  }
  var brailleInput = printToBraille(tableNames, text);
  onPaigeChange(brailleInput, true);
}

function translateWithLiblouis(inputStr, grade) {
  // Use unicode.dis if you want to translate to/from Unicode Braille instead of ASCII Braille
  // If using without unicode.dis, ASCII Braille should be rendered using the braille font (aph_braille_shadowsregular)

  // var tableNames = "unicode.dis,en-ueb-g1.ctb";
  // if (grade === '2') {
  //   tableNames = "unicode.dis,en-ueb-g2.ctb"
  // }

  var tableNames = "en-ueb-g1.ctb";
  if (grade === '2') {
    tableNames = "en-ueb-g2.ctb";
  }
  try {
    if (IS_UI_DEMO) {
      return printToBraille(tableNames, inputStr);
    } else {
      return brailleToPrint(tableNames, inputStr);
    }
  } catch (e) {
    console.error("Error with liblouis translation", e);
  }
}

function checkPotentiometerValue(line) {
  console.log({ PAIGE_POTENT_VALUE: PAIGE_POTENT_VALUE });
  if (line === 1) {
    if ((PAIGE_POTENT_VALUE >= 4) & (PAIGE_POTENT_VALUE <= 12)) return true;
  }
  if (line === 2) {
    if ((PAIGE_POTENT_VALUE >= 16) & (PAIGE_POTENT_VALUE <= 24)) return true;
  }
  if (line === 3) {
    if ((PAIGE_POTENT_VALUE >= 27) & (PAIGE_POTENT_VALUE <= 36)) return true;
  }
  if (line === 4) {
    if ((PAIGE_POTENT_VALUE >= 41) & (PAIGE_POTENT_VALUE <= 48)) return true;
  }
  if (line === 5) {
    if ((PAIGE_POTENT_VALUE >= 52) & (PAIGE_POTENT_VALUE <= 60)) return true;
  }
  return false;
}

// function onPaigeKeyDown(event) {
//   var backspace = 8;
//   if (event.keyCode == backspace) {
//     event.preventDefault();
//     return;
//   }
// }
