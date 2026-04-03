const pages = window.BOOK_DATA?.pages || [];
let currentLeftIndex = 0;
let audioUnlocked = false;
let isFlipping = false;

const leftImg = document.getElementById("leftImg");
const rightImg = document.getElementById("rightImg");
const leftLabel = document.getElementById("leftLabel");
const rightLabel = document.getElementById("rightLabel");
const flipSheet = document.getElementById("flipSheet");
const flipFront = flipSheet.querySelector(".flip-front");
const flipBack = flipSheet.querySelector(".flip-back");
const spreadInfo = document.getElementById("spreadInfo");
const totalInfo = document.getElementById("totalInfo");
const audioInfo = document.getElementById("audioInfo");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const startBtn = document.getElementById("startBtn");
const leftTap = document.getElementById("leftTap");
const rightTap = document.getElementById("rightTap");

const flipAudio = document.getElementById("flipAudio");
const narrationAudio = document.getElementById("narrationAudio");

function getPage(index) {
  return index >= 0 && index < pages.length ? pages[index] : null;
}

function renderSpread() {
  const leftPage = getPage(currentLeftIndex);
  const rightPage = getPage(currentLeftIndex + 1);

  if (leftPage) {
    leftImg.src = leftPage.image;
    leftLabel.textContent = leftPage.label || `第 ${currentLeftIndex + 1} 頁`;
  } else {
    leftImg.removeAttribute("src");
    leftLabel.textContent = "";
  }

  if (rightPage) {
    rightImg.src = rightPage.image;
    rightLabel.textContent = rightPage.label || `第 ${currentLeftIndex + 2} 頁`;
  } else {
    rightImg.removeAttribute("src");
    rightLabel.textContent = "";
  }

  const startPage = Math.min(currentLeftIndex + 1, pages.length);
  const endPage = Math.min(currentLeftIndex + 2, pages.length);
  spreadInfo.textContent = `${startPage} - ${endPage}`;
  totalInfo.textContent = String(pages.length);

  prevBtn.disabled = currentLeftIndex <= 0;
  nextBtn.disabled = currentLeftIndex + 2 >= pages.length;
}

async function unlockAudio() {
  if (audioUnlocked) return;
  try {
    narrationAudio.src = "";
    await narrationAudio.play().catch(() => {});
    narrationAudio.pause();
    narrationAudio.currentTime = 0;
    audioUnlocked = true;
    audioInfo.textContent = "已啟用";
    startBtn.textContent = "閱讀中";
    startBtn.disabled = true;
    await playNarrationForCurrentSpread();
  } catch (err) {
    console.warn(err);
    audioInfo.textContent = "音訊啟用失敗";
  }
}

async function playSingleAudio(src) {
  if (!src) return;
  return new Promise((resolve) => {
    narrationAudio.pause();
    narrationAudio.src = src;
    narrationAudio.currentTime = 0;
    const done = () => {
      narrationAudio.removeEventListener("ended", done);
      narrationAudio.removeEventListener("error", done);
      resolve();
    };
    narrationAudio.addEventListener("ended", done, { once: true });
    narrationAudio.addEventListener("error", done, { once: true });
    narrationAudio.play().catch(() => resolve());
  });
}

async function playNarrationForCurrentSpread() {
  if (!audioUnlocked) return;
  audioInfo.textContent = "朗讀中";
  const leftPage = getPage(currentLeftIndex);
  const rightPage = getPage(currentLeftIndex + 1);
  await playSingleAudio(leftPage?.audio);
  await playSingleAudio(rightPage?.audio);
  audioInfo.textContent = "待命";
}

function playFlipSound() {
  try {
    flipAudio.currentTime = 0;
    flipAudio.play();
  } catch (err) {
    console.warn(err);
  }
}

function prepareFlipAnimation(direction) {
  const currentRight = getPage(currentLeftIndex + 1);
  const nextLeft = getPage(currentLeftIndex + 2);
  const currentLeft = getPage(currentLeftIndex);
  const prevRight = getPage(currentLeftIndex - 1);

  flipFront.style.backgroundImage = `url("${(direction === "next" ? currentRight : currentLeft)?.image || ""}")`;
  flipBack.style.backgroundImage = `url("${(direction === "next" ? nextLeft : prevRight)?.image || ""}")`;
}

function flipTo(direction) {
  if (isFlipping) return;
  if (direction === "next" && currentLeftIndex + 2 >= pages.length) return;
  if (direction === "prev" && currentLeftIndex <= 0) return;

  isFlipping = true;
  narrationAudio.pause();
  audioInfo.textContent = audioUnlocked ? "翻頁中" : "尚未啟用";

  prepareFlipAnimation(direction);
  flipSheet.classList.remove("active");
  void flipSheet.offsetWidth;
  flipSheet.classList.add("active");
  playFlipSound();

  setTimeout(() => {
    currentLeftIndex += (direction === "next" ? 2 : -2);
    renderSpread();
  }, 340);

  setTimeout(async () => {
    flipSheet.classList.remove("active");
    isFlipping = false;
    await playNarrationForCurrentSpread();
  }, 760);
}

startBtn.addEventListener("click", unlockAudio);
prevBtn.addEventListener("click", () => flipTo("prev"));
nextBtn.addEventListener("click", () => flipTo("next"));
leftTap.addEventListener("click", () => flipTo("prev"));
rightTap.addEventListener("click", () => flipTo("next"));

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") flipTo("prev");
  if (e.key === "ArrowRight") flipTo("next");
});

renderSpread();