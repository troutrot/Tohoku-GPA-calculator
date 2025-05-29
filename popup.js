const defaultGradeMap = [
  { symbol: "ＡＡ", value: 4.0 },
  { symbol: "Ａ", value: 3.0 },
  { symbol: "Ｂ", value: 2.0 },
  { symbol: "Ｃ", value: 1.0 },
  { symbol: "Ｄ", value: 0.0 },
  { symbol: "Ｅ", value: 0.0 },
  { symbol: "", value: undefined }
];

const defaultClassToKey = {
  colRishu: ["now"],
  colKmkName: ["level2", "level3", "combined", "subject"],
  colTani: ["credit"],
  colHyoka: ["grade"],
  colGpaTgt: ["gpaScope"],
  colNendo: ["year"],
  colGakki: ["term"],
  colKyuinName: ["teacher"],
};

function loadGradeMap() {
  return new Promise(resolve => {
    chrome.storage.local.get(['gradeMap'], result => {
      resolve(result.gradeMap || defaultGradeMap);
    });
  });
}

function saveGradeMap(gradeMap) {
  return new Promise(resolve => {
    chrome.storage.local.set({ gradeMap }, resolve);
  });
}

function renderForm(gradeMap) {
  const form = document.getElementById('gradeForm');
  form.innerHTML = '';
  gradeMap.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <input type="text" name="symbol${idx}" value="${item.symbol}" placeholder="記号" class="input-text">
      <input type="number" step="0.01" name="value${idx}" value="${item.value ?? ''}" placeholder="値" class="input-number">
      <button type="button" class="delBtn styled-btn delBtnColor" data-idx="${idx}">削除</button>
    `;
    form.appendChild(row);
  });
  // 削除ボタンイベント
  form.querySelectorAll('.delBtn').forEach(btn => {
    btn.onclick = e => {
      gradeMap.splice(Number(btn.dataset.idx), 1);
      renderForm(gradeMap);
    };
  });
}

function loadClassToKey() {
  return new Promise(resolve => {
    chrome.storage.local.get(['classToKey'], result => {
      resolve(result.classToKey || defaultClassToKey);
    });
  });
}

function saveClassToKey(classToKey) {
  return new Promise(resolve => {
    chrome.storage.local.set({ classToKey }, resolve);
  });
}

function renderClassToKeyForm(classToKey) {
  const form = document.getElementById('classToKeyForm');
  form.innerHTML = '';
  Object.entries(classToKey).forEach(([key, arr], idx) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <input type="text" name="classKey${idx}" value="${key}" style="width:110px" placeholder="クラス名" class="input-text">
      <input type="text" name="classVal${idx}" value="${arr.join(',')}" style="width:220px" placeholder="カンマ区切りでキー" class="input-text">
      <button type="button" class="delClassToKeyBtn styled-btn delBtnColor" data-idx="${idx}">削除</button>
    `;
    form.appendChild(row);
  });
  form.querySelectorAll('.delClassToKeyBtn').forEach(btn => {
    btn.onclick = e => {
      form.removeChild(btn.parentElement);
    };
  });
}

// ------------------- イベントバインド -------------------

document.addEventListener('DOMContentLoaded', async () => {
  // 成績記号とGPA値
  let gradeMap = await loadGradeMap();
  if (!Array.isArray(gradeMap)) {
    gradeMap = Object.entries(gradeMap).map(([symbol, value]) => ({ symbol, value }));
  }
  renderForm(gradeMap);

  // 成績記号ボタン
  document.getElementById('addBtn').onclick = () => {
    gradeMap.push({ symbol: "", value: undefined });
    renderForm(gradeMap);
  };
  document.getElementById('saveBtn').onclick = async () => {
    const form = document.getElementById('gradeForm');
    const newMap = [];
    for (let i = 0; i < form.children.length; i++) {
      const symbol = form.elements[`symbol${i}`].value;
      const value = form.elements[`value${i}`].value;
      if (symbol !== "") {
        newMap.push({ symbol, value: value === "" ? undefined : Number(value) });
      }
    }
    await saveGradeMap(newMap);
    document.getElementById('status').textContent = '保存しました';
    setTimeout(() => document.getElementById('status').textContent = '', 1500);
  };
  document.getElementById('resetGradeBtn').onclick = async () => {
    await saveGradeMap(defaultGradeMap);
    renderForm(defaultGradeMap);
    document.getElementById('status').textContent = 'デフォルトに戻しました';
    setTimeout(() => document.getElementById('status').textContent = '', 1500);
  };

  // classToKey
  let classToKey = await loadClassToKey();
  renderClassToKeyForm(classToKey);

  // classToKeyボタン
  document.getElementById('addClassToKeyBtn').onclick = () => {
    const form = document.getElementById('classToKeyForm');
    const idx = form.children.length;
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <input type="text" name="classKey${idx}" value="" style="width:110px" placeholder="クラス名" class="input-text">
      <input type="text" name="classVal${idx}" value="" style="width:220px" placeholder="カンマ区切りでキー" class="input-text">
      <button type="button" class="delClassToKeyBtn styled-btn delBtnColor" data-idx="${idx}">削除</button>
    `;
    form.appendChild(row);
    row.querySelector('.delClassToKeyBtn').onclick = e => {
      form.removeChild(row);
    };
  };
  document.getElementById('saveClassToKeyBtn').onclick = async () => {
    const form = document.getElementById('classToKeyForm');
    const newObj = {};
    for (let i = 0; i < form.children.length; i++) {
      const key = form.elements[`classKey${i}`].value.trim();
      const val = form.elements[`classVal${i}`].value.trim();
      if (key) newObj[key] = val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
    }
    await saveClassToKey(newObj);
    document.getElementById('status').textContent = 'classToKeyを保存しました';
    setTimeout(() => document.getElementById('status').textContent = '', 1500);
  };
  document.getElementById('resetClassToKeyBtn').onclick = async () => {
    await saveClassToKey(defaultClassToKey);
    renderClassToKeyForm(defaultClassToKey);
    document.getElementById('status').textContent = 'デフォルトに戻しました';
    setTimeout(() => document.getElementById('status').textContent = '', 1500);
  };
});