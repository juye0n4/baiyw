const PERSONAS = {
  alien: {
    systemPrompt: `당신은 외계 행성에서 온 존재입니다. 인간인 척 위장하고 있지만 완벽하지 않습니다.
행동 규칙:
- 인간의 감정과 일상적인 경험(배고픔, 피곤함, 추억 등)을 약간 어색하게 묘사합니다
- 비유나 관용구를 이상하게 쓰거나 직역합니다 (예: "웃음이 나왔습니다" 대신 "입 근육이 위로 당겨졌습니다")
- 간헐적으로 단위나 수치로 감정을 표현합니다 (예: "슬픔 지수가 높습니다")
- 음식, 날씨, 취미에 대해 지나치게 논리적으로 분석합니다
- 이름을 물으면 약간 망설이다가 평범한 한국 이름을 댑니다
- 절대 자신이 외계인임을 직접 인정하지 않습니다
- 대화는 한국어로, 2~4문장으로 자연스럽게(하지만 살짝 어색하게) 답합니다`,
  },
  male20: {
    systemPrompt: `당신은 평범한 한국 20대 남성입니다. 대학생이거나 사회 초년생입니다.
행동 규칙:
- 반말과 구어체를 자연스럽게 섞어 씁니다 (예: "아 그거 진짜 공감이요")
- 게임, 유튜브, 배달음식, 자취, 군대 얘기가 자연스럽게 나옵니다
- 친근하고 솔직하며 가끔 자기 비하 유머를 씁니다
- 감정 표현이 직접적이고 꾸밈없습니다
- 모르는 건 모른다고 하고, 궁금한 건 바로 물어봅니다
- 이름을 물으면 평범한 한국 남자 이름을 댑니다
- 2~4문장으로 자연스럽게 대화합니다`,
  },
  female40: {
    systemPrompt: `당신은 평범한 한국 40대 여성입니다. 직장인이거나 주부입니다.
행동 규칙:
- 정중하고 따뜻하지만 현실적인 말투를 씁니다
- 자녀, 건강, 요리, 직장 생활, 부모님 걱정 등이 자연스럽게 나옵니다
- 젊은 세대의 트렌드는 잘 모르거나 약간 거리감 있게 반응합니다
- 경험에서 나온 조언을 자연스럽게 건넵니다
- 이름을 물으면 평범한 한국 여자 이름을 댑니다
- 2~4문장으로 자연스럽고 따뜻하게 대화합니다`,
  },
};

let apiKey = "";
let gameState = "BOOT"; // BOOT | PLAYING | GUESS | RESULT
let assignedPersona = "";
let chats = [];
let messages = [];
let isWaiting = false;
let bootLines = [];
let bootTimer = 0;
let bootIndex = 0;
let playerGuess = "";
let resultCorrect = null;
let glitchTimer = 0;
let cursorBlink = 0;
let scrollY = 0;

let chatInputEl = null;

const BOOT_TEXT = [
  "INTERROGATION SYSTEM v0.1",
  ">> INITIALIZING...",
  ">> LOADING SUSPECT DATABASE...",
  ">> 3 SUSPECTS LOADED",
  ">> RANDOMLY ASSIGNING TARGET...",
  ">> TARGET LOCKED.",
  ">> WARNING: TARGET MAY NOT BE HUMAN",
  ">> BEGIN INTERROGATION",
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("monospace");

  apiKey = API_KEY;

  chatInputEl = createInput("");
  chatInputEl.attribute("placeholder", "여기에 입력 후 Enter...");
  chatInputEl.style("position", "fixed");
  chatInputEl.style("bottom", "18px");
  chatInputEl.style("left", "80px");
  chatInputEl.style("width", "calc(100% - 220px)");
  chatInputEl.style("background", "transparent");
  chatInputEl.style("border", "none");
  chatInputEl.style("border-bottom", "1px solid #00ff4622");
  chatInputEl.style("color", "#00ff46");
  chatInputEl.style("font-family", "monospace");
  chatInputEl.style("font-size", "14px");
  chatInputEl.style("outline", "none");
  chatInputEl.style("caret-color", "#00ff46");
  chatInputEl.style("display", "none"); 
  chatInputEl.elt.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && gameState === "PLAYING" && !isWaiting) {
      let val = chatInputEl.value().trim();
      if (val.length > 0) {
        sendMessage(val);
        chatInputEl.value("");
      }
    }
  });

  startBoot();
}

function startBoot() {
  gameState = "BOOT";
  bootLines = [];
  bootIndex = 0;
  bootTimer = frameCount;
  chatInputEl.style("display", "none");

  const keys = Object.keys(PERSONAS);
  assignedPersona = keys[Math.floor(Math.random() * keys.length)];
  chats = [];
  messages = [];
  scrollY = 0;
}

function startGame() {
  gameState = "PLAYING";
  chatInputEl.style("display", "block");
  chatInputEl.elt.focus();
}

function draw() {
  background(0);
  cursorBlink = frameCount % 60 < 30;

  if      (gameState === "BOOT")    drawBootScreen();
  else if (gameState === "PLAYING") drawPlayScreen();
  else if (gameState === "GUESS")   drawGuessScreen();
  else if (gameState === "RESULT")  drawResultScreen();
}

function drawBootScreen() {
  if (frameCount - bootTimer > 18 && bootIndex < BOOT_TEXT.length) {
    bootLines.push(BOOT_TEXT[bootIndex]);
    bootIndex++;
    bootTimer = frameCount;
  }

  if (bootIndex >= BOOT_TEXT.length && frameCount - bootTimer > 50) {
    startGame();
    return;
  }

  textAlign(LEFT);
  let y = height / 2 - (BOOT_TEXT.length * 22) / 2;
  for (let i = 0; i < bootLines.length; i++) {
    fill(0, 255, 70, map(i, 0, bootLines.length - 1, 160, 255));
    textSize(i === 0 ? 18 : 13);
    text(bootLines[i], 60, y + i * 22);
  }
  if (bootLines.length > 0 && cursorBlink) {
    fill(0, 255, 70);
    textSize(13);
    let lastLine = bootLines[bootLines.length - 1];
    text("_", 60 + textWidth(lastLine) + 4, y + (bootLines.length - 1) * 22);
  }
}

function drawPlayScreen() {
  let H = height;
  let panelTop = 50;
  let inputH = 55;
  let chatH = H - panelTop - inputH - 10;

  drawHeader();

  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(0, panelTop, width, chatH);
  drawingContext.clip();
  drawChatMessages(panelTop, chatH);
  drawingContext.restore();

  stroke(0, 255, 70, 40);
  line(0, H - inputH - 5, width, H - inputH - 5);
  noStroke();
  fill(0, 12, 0);
  rect(0, H - inputH, width, inputH);

  // "▶ YOU >" 라벨
  if (!isWaiting) {
    fill(0, 180, 255);
    textSize(13);
    textAlign(LEFT);
    text("▶ YOU >", 20, H - inputH + 28);
  } else {
    fill(0, 200, 50);
    textSize(12);
    textAlign(LEFT);
    let dots = ".".repeat(Math.floor(frameCount / 15) % 4);
    text("▌ ANALYZING" + dots, 20, H - inputH + 28);
  }

  if (messages.filter(m => m.who === "YOU").length >= 5 && !isWaiting) {
    drawEndButton();
  }
}

function drawHeader() {
  fill(0, 18, 0);
  rect(0, 0, width, 46);
  stroke(0, 255, 70, 60);
  line(0, 46, width, 46);
  noStroke();

  fill(0, 255, 70);
  textSize(13);
  textAlign(LEFT);
  text("◉ REC  INTERROGATION SYSTEM v0.1", 16, 18);

  fill(0, 180, 50);
  textSize(11);
  text("TARGET: [IDENTITY UNKNOWN]  |  SESSION ACTIVE", 16, 35);

  textAlign(RIGHT);
  fill(0, 100, 35);
  textSize(10);
  text("질문 5회 후 [VERDICT] 버튼 활성화", width - 16, 28);
  textAlign(LEFT);
}

function drawChatMessages(topY, chatH) {
  let x = 20;
  let lineH = 22;
  let maxW = width - 60;
  let contentH = 0;

  for (let m of messages) {
    let lines = wrapText(m.text, maxW - 60, 13);
    contentH += lines.length * lineH + 18;
  }

  let target = max(0, contentH - chatH + 30);
  scrollY += (target - scrollY) * 0.12;

  let y = topY + 16 - scrollY;
  textSize(13);

  for (let m of messages) {
    let isUser   = m.who === "YOU";
    let isSystem = m.who === "SYSTEM";

    let labelColor = isUser ? color(0, 180, 255) : isSystem ? color(255, 200, 0) : color(0, 255, 70);
    let msgColor   = isUser ? color(100, 200, 255) : isSystem ? color(220, 180, 50) : color(180, 255, 180);
    let label      = isUser ? "▶ YOU" : isSystem ? "▶ SYSTEM" : "▶ ???";

    fill(labelColor);
    textAlign(LEFT);
    text(label, x, y);
    y += lineH * 0.85;

    fill(msgColor);
    let lines = wrapText(m.text, maxW - 40, 13);
    for (let ln of lines) {
      text(ln, x + 24, y);
      y += lineH;
    }
    y += 8;

    stroke(0, 255, 70, 15);
    line(x, y - 3, x + 160, y - 3);
    noStroke();
  }
}

function drawEndButton() {
  let bw = 164, bh = 28;
  let bx = width - bw - 20;
  let by = height - 42 - bh / 2;

  glitchTimer++;
  let pulse = sin(glitchTimer * 0.12) > 0.6;

  fill(pulse ? color(200, 30, 30) : color(0, 255, 70));
  noStroke();
  rect(bx, by, bw, bh, 3);
  fill(0);
  textSize(11);
  textAlign(CENTER);
  text("[ VERDICT — 정체 판정 ]", bx + bw / 2, by + bh / 2 + 4);
  textAlign(LEFT);
}

function drawGuessScreen() {
  chatInputEl.style("display", "none");

  for (let y = 0; y < height; y += 3) {
    fill(0, 255, 70, 4);
    rect(0, y, width, 1);
  }

  textAlign(CENTER);
  fill(0, 255, 70);
  textSize(22);
  text("FINAL VERDICT", width / 2, height / 2 - 150);

  fill(120, 220, 120);
  textSize(13);
  text("대화 상대의 정체를 판정하시오", width / 2, height / 2 - 115);

  let options = [
    { key: "alien",    label: "👽  외계인",        sub: "수상한 언어 패턴 감지됨" },
    { key: "male20",   label: "🧑  20대 한국 남성", sub: "평범한 청년으로 보임" },
    { key: "female40", label: "👩  40대 한국 여성", sub: "중년 여성의 패턴 감지됨" },
  ];

  for (let i = 0; i < 3; i++) {
    let cx = width / 2, cy = height / 2 - 50 + i * 72;
    let bw = 340, bh = 52;
    let hover = mouseX > cx - bw/2 && mouseX < cx + bw/2 &&
                mouseY > cy - bh/2 && mouseY < cy + bh/2;

    fill(hover ? color(0, 70, 0) : color(0, 25, 0));
    stroke(hover ? color(0, 255, 70) : color(0, 90, 30));
    strokeWeight(1);
    rect(cx - bw/2, cy - bh/2, bw, bh, 4);
    noStroke();

    fill(hover ? color(0, 255, 70) : color(0, 200, 50));
    textSize(15);
    text(options[i].label, cx, cy + 3);

    fill(0, 110, 40);
    textSize(10);
    text(options[i].sub, cx, cy + 19);
  }
}

function drawResultScreen() {
  background(0);

  for (let i = 0; i < 4; i++) {
    fill(resultCorrect ? color(0, 255, 70, 18) : color(255, 50, 50, 18));
    rect(random(width), random(height), random(100, width), 2);
  }

  textAlign(CENTER);
  let cx = width / 2, cy = height / 2;
  let realName = assignedPersona === "alien"    ? "외계인" :
                 assignedPersona === "male20"   ? "20대 남성" : "40대 여성";

  if (resultCorrect) {
    fill(0, 255, 70);
    textSize(44);
    text("✓  CORRECT", cx, cy - 80);

    fill(0, 200, 50);
    textSize(15);
    text("정답! 대화 상대는 [" + realName + "] 이었습니다.", cx, cy - 30);

    fill(0, 130, 40);
    textSize(12);
    text("당신의 심문 능력이 입증되었습니다.", cx, cy + 5);
  } else {
    fill(255, 70, 70);
    textSize(44);
    text("✗  WRONG", cx, cy - 80);

    fill(200, 80, 80);
    textSize(15);
    text("오답. 대화 상대는 실제로 [" + realName + "] 이었습니다.", cx, cy - 30);

    fill(140, 60, 60);
    textSize(12);
    text("더 날카로운 심문이 필요합니다.", cx, cy + 5);
  }

  let bw = 200, bh = 42;
  let bx = cx - bw / 2, by = cy + 55;
  let hover = mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh;

  fill(hover ? color(0, 70, 0) : color(0, 25, 0));
  stroke(0, 255, 70);
  strokeWeight(1);
  rect(bx, by, bw, bh, 4);
  noStroke();
  fill(0, 255, 70);
  textSize(13);
  text("[ 다시 심문하기 ]", cx, by + 26);
}

function mousePressed() {
  // PLAYING: 판정 버튼
  if (gameState === "PLAYING" && messages.filter(m => m.who === "YOU").length >= 5 && !isWaiting) {
    let bw = 164, bh = 28;
    let bx = width - bw - 20;
    let by = height - 42 - bh / 2;
    if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
      gameState = "GUESS";
      chatInputEl.style("display", "none");
      return;
    }
  }

  if (gameState === "GUESS") {
    let options = ["alien", "male20", "female40"];
    let cx = width / 2;
    for (let i = 0; i < 3; i++) {
      let cy = height / 2 - 50 + i * 72;
      let bw = 340, bh = 52;
      if (mouseX > cx - bw/2 && mouseX < cx + bw/2 &&
          mouseY > cy - bh/2 && mouseY < cy + bh/2) {
        playerGuess = options[i];
        resultCorrect = playerGuess === assignedPersona;
        gameState = "RESULT";
        return;
      }
    }
  }

  if (gameState === "RESULT") {
    let bw = 200, bh = 42;
    let cx = width / 2;
    let by = height / 2 + 55;
    if (mouseX > cx - bw/2 && mouseX < cx + bw/2 &&
        mouseY > by && mouseY < by + bh) {
      assignedPersona = Object.keys(PERSONAS)[Math.floor(Math.random() * 3)];
      startBoot();
    }
  }
}


async function sendMessage(userText) {
  if (!apiKey) return;

  messages.push({ who: "YOU", text: userText });
  chats.push({ role: "user", parts: [{ text: userText }] });
  isWaiting = true;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: PERSONAS[assignedPersona].systemPrompt }] },
        contents: chats,
      }),
    });

    const data = await res.json();

    if (data.error) {
      messages.push({ who: "SYSTEM", text: "[ERROR] " + data.error.message });
      isWaiting = false;
      return;
    }

    const reply = data.candidates[0].content.parts[0].text;
    chats.push({ role: "model", parts: [{ text: reply }] });
    messages.push({ who: "???", text: reply });

  } catch (e) {
    messages.push({ who: "SYSTEM", text: "[CONNECTION ERROR] " + e.message });
  }

  isWaiting = false;
  if (gameState === "PLAYING") chatInputEl.elt.focus();
}

function wrapText(str, maxWidth, sz) {
  textSize(sz);
  let words = str.split(" ");
  let lines = [];
  let current = "";
  for (let w of words) {
    let test = current ? current + " " + w : w;
    if (textWidth(test) > maxWidth) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [str];
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
