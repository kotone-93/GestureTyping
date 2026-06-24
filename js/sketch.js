// ジェスチャーの種類: rock, scissors, ok
function getCode(left_gesture, right_gesture) {
  let code_array = {
    "rock": 1,
    "scissors": 2,
    "ok": 3,
  }
  let left_code = code_array[left_gesture];
  let right_code = code_array[right_gesture];
  if (!left_code || !right_code) {
    return "";
  }
  // left_codeとright_codeを文字として結合
  let code = String(left_code) + String(right_code);
  return code;
}

function getCharacter(code, stage) {
  // stage 0: a-i, stage 1: j-r, stage 2: s-z + space
  const stages = [
    {
      "11": "a", "12": "b", "13": "c",
      "21": "d", "22": "e", "23": "f",
      "31": "g", "32": "h", "33": "i"
    },
    {
      "11": "j", "12": "k", "13": "l",
      "21": "m", "22": "n", "23": "o",
      "31": "p", "32": "q", "33": "r"
    },
    {
      "11": "s", "12": "t", "13": "u",
      "21": "v", "22": "w", "23": "x",
      "31": "y", "32": "z", "33": " "
    }
  ];
  if (stage < 0 || stage >= stages.length) {
    return "";
  }
  return stages[stage][code] || "";
}

// 入力サンプル文章 
let sample_texts = [
  "the quick brown fox jumps over the lazy dog",
];

// ゲームの状態を管理する変数
// notready: ゲーム開始前 （カメラ起動前）
// ready: ゲーム開始前（カメラ起動後）
// playing: ゲーム中
// finished: ゲーム終了後
// ready, playing, finished
let game_mode = {
  now: "notready",
  previous: "notready",
};

let game_start_time = 0;
let gestures_results;
let cam = null;
let p5canvas = null;
let currentStage = 0; // 0: a-i, 1: j-r, 2: s-z+space

function setup() {
  p5canvas = createCanvas(320, 240);
  p5canvas.parent('#canvas');

  // Multi-stage selection using two-hand combinations
  let lastCode = "";
  let lastCodeTime = 0;
  let lastTypeTime = 0;
  const holdThresholdMs = 700;
  const repeatThresholdMs = 850;

  // Single-hand hold for mode switch / long press for backspace / space
  let singleHandGesture = "";
  let singleHandTime = 0;
  let singleHandModeSwitched = false;
  let singleHandActionDone = false;
  let singleHandLastRepeatTime = 0;
  const modeSwitchThresholdMs = 400; // モード切替に必要なホールド時間
  const singleHoldThresholdMs = 1200; // 長押しアクションのホールド時間

  gotGestures = function (results) {
    gestures_results = results;
    const now = millis();

    // Game start trigger
    if (game_mode.now == "ready" && game_mode.previous == "notready" && results.gestures && results.gestures.length > 0) {
      game_mode.previous = game_mode.now;
      game_mode.now = "playing";
      document.querySelector('input').value = "";
      game_start_time = millis();
    }

    // 片手だけならモード切替 or 長押しでバックスペース/スペース
    if (results.gestures && results.gestures.length === 1) {
      const gesture = results.gestures[0]?.[0]?.categoryName || "";

      if (gesture !== singleHandGesture) {
        // ジェスチャーが変わったらタイマーをリセット
        singleHandGesture = gesture;
        singleHandTime = now;
        singleHandModeSwitched = false;
        singleHandActionDone = false;
        singleHandLastRepeatTime = 0;
      } else {
        const held = now - singleHandTime;

        // 400ms以上で初めてモード切替（誤動作防止）
        if (held >= modeSwitchThresholdMs && !singleHandModeSwitched) {
          if (gesture === "rock") currentStage = 0;
          else if (gesture === "scissors") currentStage = 1;
          else if (gesture === "ok") currentStage = 2;
          singleHandModeSwitched = true;
        }

        // 800ms以上で長押しアクション
        if (held >= singleHoldThresholdMs) {
          if (gesture === "rock" && !singleHandActionDone) {
            // バックスペース：1回だけ発動
            typeChar("backspace");
            singleHandActionDone = true;
          } else if (gesture === "ok" && !singleHandActionDone) {
            // スペース：1回だけ発動
            typeChar(" ");
            singleHandActionDone = true;
          }
        }
      }

      lastCode = "";
      return;
    }

    // 片手でない場合はシングルハンド状態をリセット
    singleHandGesture = "";
    singleHandModeSwitched = false;
    singleHandActionDone = false;
    singleHandLastRepeatTime = 0;

    if (!results.gestures || results.gestures.length < 2) {
      lastCode = "";
      return;
    }

    let left_gesture = "";
    let right_gesture = "";
    
    // Extract left and right gestures
    for (let i = 0; i < results.gestures.length; i++) {
      const gestureName = results.gestures[i]?.[0]?.categoryName || "";
      // Use handedness if available
      const handName = results.handednesses?.[i]?.[0]?.categoryName || (i === 0 ? "Left" : "Right");
      if (handName.includes("Left") || handName === "Left") {
        left_gesture = gestureName;
      } else {
        right_gesture = gestureName;
      }
    }

    const code = getCode(left_gesture, right_gesture);
    const c = getCharacter(code, currentStage);

    if (c === "") {
      lastCode = "";
      return;
    }

    // Same code held for threshold time
    if (code !== lastCode) {
      lastCode = code;
      lastCodeTime = now;
      return;
    }

    if (now - lastCodeTime >= holdThresholdMs && now - lastTypeTime >= repeatThresholdMs) {
      typeChar(c);
      lastTypeTime = now;
      // charCountInStage++;
      
      // // Auto-advance stage after certain number of characters
      // if (charCountInStage >= stageAdvanceCharCount && currentStage < 2) {
      //   currentStage++;
      //   charCountInStage = 0;
      // }
    }

  }
}

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// ここから下は課題制作にあたって編集してはいけません。
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// 入力欄に文字を追加する場合は必ずこの関数を使用してください。
function typeChar(c) {
  if (c === "") {
    console.warn("Empty character received, ignoring.");
    return;
  }
  // inputにフォーカスする
  document.querySelector('input').focus();
  // 入力欄に文字を追加または削除する関数
  const input = document.querySelector('input');
  if (c === "backspace") {
    input.value = input.value.slice(0, -1);
  } else {
    input.value += c;
  }

  let inputValue = input.value;
  // #messageのinnerTextを色付けして表示
  const messageElem = document.querySelector('#message');
  const target = messageElem.innerText;
  let matchLen = 0;
  for (let i = 0; i < Math.min(inputValue.length, target.length); i++) {
    if (inputValue[i] === target[i]) {
      matchLen++;
    } else {
      break;
    }
  }
  const matched = target.slice(0, matchLen);
  const unmatched = target.slice(matchLen);
  console.log(`Matched: ${matched}, Unmatched: ${unmatched}`);
  messageElem.innerHTML =
    `<span style="background-color:lightgreen">${matched}</span><span style="background-color:transparent">${unmatched}</span>`;




  // もしvalueの値がsample_texts[0]と同じになったら、[0]を削除して、次のサンプル文章に移行する。配列長が0になったらゲームを終了する
  if (document.querySelector('input').value == sample_texts[0]) {
    sample_texts.shift(); // 最初の要素を削除
    console.log(sample_texts.length);
    if (sample_texts.length == 0) {
      // サンプル文章がなくなったらゲーム終了
      game_mode.previous = game_mode.now;
      game_mode.now = "finished";
      document.querySelector('input').value = "";
      const elapsedSec = ((millis() - game_start_time) / 1000).toFixed(2);
      document.querySelector('#message').innerText = `Finished: ${elapsedSec} sec`;
    } else {
      // 次のサンプル文章に移行
      document.querySelector('input').value = "";
      document.querySelector('#message').innerText = sample_texts[0];
    }
  }

}


function startWebcam() {
  // If the function setCameraStreamToMediaPipe is defined in the window object, the camera stream is set to MediaPipe.
  if (window.setCameraStreamToMediaPipe) {
    cam = createCapture(VIDEO);
    cam.hide();
    cam.elt.onloadedmetadata = function () {
      window.setCameraStreamToMediaPipe(cam.elt);
    }
    p5canvas.style('width', '100%');
    p5canvas.style('height', 'auto');
  }

  if (game_mode.now == "notready") {
    game_mode.previous = game_mode.now;
    game_mode.now = "ready";
    document.querySelector('#message').innerText = sample_texts[0];
    game_start_time = millis();
  }
}


function draw() {
  background(127);
  if (cam) {
    image(cam, 0, 0, width, height);
  }
  // 各頂点座標を表示する
  // 各頂点座標の位置と番号の対応は以下のURLを確認
  // https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
  if (gestures_results) {
    if (gestures_results.landmarks) {
      for (const landmarks of gestures_results.landmarks) {
        for (let landmark of landmarks) {
          noStroke();
          fill(100, 150, 210);
          circle(landmark.x * width, landmark.y * height, 10);
        }
      }
    }

    // ジェスチャーの結果を表示する
    for (let i = 0; i < gestures_results.gestures.length; i++) {
      noStroke();
      fill(255, 0, 0);
      textSize(10);
      let name = gestures_results.gestures[i][0].categoryName;
      let score = gestures_results.gestures[i][0].score;
      let right_or_left = gestures_results.handednesses[i][0].hand;
      let pos = {
        x: gestures_results.landmarks[i][0].x * width,
        y: gestures_results.landmarks[i][0].y * height,
      };
      textSize(20);
      fill(0);
      textAlign(CENTER, CENTER);
      text(name, pos.x, pos.y);
    }
  }

  if (game_mode.now == "notready") {
    // 文字の後ろを白で塗りつぶす
    let msg = "Press the start button to begin";
    textSize(18);
    let tw = textWidth(msg) + 20;
    let th = 32;
    let tx = width / 2;
    let ty = height / 2;
    rectMode(CENTER);
    fill(255, 100);
    noStroke();
    rect(tx, ty, tw, th, 8);
    fill(0);
    textAlign(CENTER, CENTER);
    text(msg, tx, ty);
  }
  else if (game_mode.now == "ready") {
    let msg = "Waiting for gestures to start";
    textSize(18);
    let tw = textWidth(msg) + 20;
    let th = 32;
    let tx = width / 2;
    let ty = height / 2;
    rectMode(CENTER);
    fill(255, 100);
    noStroke();
    rect(tx, ty, tw, th, 8);
    fill(0);
    textAlign(CENTER, CENTER);
    text(msg, tx, ty);
  }
  else if (game_mode.now == "playing") {
    // ゲーム中のメッセージ
    let elapsedSec = ((millis() - game_start_time) / 1000).toFixed(2);
    let msg = `${elapsedSec} [s]`;
    textSize(18);
    let tw = textWidth(msg) + 20;
    let th = 32;
    let tx = width / 2;
    let ty = th;
    rectMode(CENTER);
    fill(255, 100);
    noStroke();
    rect(tx, ty, tw, th, 8);
    fill(0);
    textAlign(CENTER, CENTER);
    text(msg, tx, ty);
  }
  else if (game_mode.now == "finished") {
    // ゲーム終了後のメッセージ
    let msg = "Game finished!";
    textSize(18);
    let tw = textWidth(msg) + 20;
    let th = 32;
    let tx = width / 2;
    let ty = height / 2;
    rectMode(CENTER);
    fill(255, 100);
    noStroke();
    rect(tx, ty, tw, th, 8);
    fill(0);
    textAlign(CENTER, CENTER);
    text(msg, tx, ty);
  }

  fill(255);
textSize(20);
textAlign(LEFT, TOP);

const stageNames = [
  "Stage 0 : a-i",
  "Stage 1 : j-r",
  "Stage 2 : s-z"
];

text(stageNames[currentStage], 10, 10);

}


