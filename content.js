// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- config =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

const domainDefaults = {
  "unipa.bureau.tohoku.ac.jp": {
    gradeMapArr: [
      { symbol: "ＡＡ", value: 4.0 },
      { symbol: "Ａ", value: 3.0 },
      { symbol: "Ｂ", value: 2.0 },
      { symbol: "Ｃ", value: 1.0 },
      { symbol: "Ｄ", value: 0.0 },
      { symbol: "Ｅ", value: 0.0 },
      { symbol: "", value: undefined }
    ],
    classToKey: {
      colRishu: ["now"],
      colKmkName: ["level2", "level3", "combined", "subject"],
      colTani: ["credit"],
      colHyoka: ["grade"],
      colGpaTgt: ["gpaScope"],
      colNendo: ["year"],
      colGakki: ["term"],
      colKyuinName: ["teacher"],
    }
  },
  "portal.kokugakuin.jp": {
    gradeMapArr: [
      { symbol: "S", value: 4.0 },
      { symbol: "A", value: 3.0 },
      { symbol: "B", value: 2.0 },
      { symbol: "C", value: 1.0 },
      { symbol: "D", value: 0.0 },
      { symbol: "E", value: 0.0 },
      { symbol: "", value: undefined }
    ],
    classToKey: {
      colRishu: ["now"],
      colKmkName: ["level1", "level2", "level3", "subject"],
      colTani: ["credit"],
      colHyoka: ["grade"],
      colGpaTgt: ["gpaScope"],
      colNendo: ["year"],
      colGakki: ["term"],
      colKyuinName: ["teacher"],
      colSoten: ["score"]
    }
  }
};

// --- ドメイン判定 ---
const currentDomain = location.hostname.replace(/^www\./, '');
let defaultGradeMapArr = [
  { symbol: "ＡＡ", value: 4.0 },
  { symbol: "Ａ", value: 3.0 },
  { symbol: "Ｂ", value: 2.0 },
  { symbol: "Ｃ", value: 1.0 },
  { symbol: "Ｄ", value: 0.0 },
  { symbol: "Ｅ", value: 0.0 },
  { symbol: "", value: undefined }
];
let defaultClassToKey = {
  colRishu: ["now"],
  colKmkName: ["level2", "level3", "combined", "subject"],
  colTani: ["credit"],
  colHyoka: ["grade"],
  colGpaTgt: ["gpaScope"],
  colNendo: ["year"],
  colGakki: ["term"],
  colKyuinName: ["teacher"],
};

if (domainDefaults[currentDomain]) {
  defaultGradeMapArr = domainDefaults[currentDomain].gradeMapArr;
  defaultClassToKey = domainDefaults[currentDomain].classToKey;
}

// --- 既存のgradeMapArr/classToKeyをdefaultGradeMapArr/defaultClassToKeyで初期化 ---
let gradeMapArr = defaultGradeMapArr.slice();
let classToKey = JSON.parse(JSON.stringify(defaultClassToKey));

// オブジェクト形式も用意
let gradeMap = Object.fromEntries(gradeMapArr.map(item => [item.symbol, item.value]));

// storageから取得して両方更新（ただしドメイン既定値を優先）
chrome.storage?.local.get(['gradeMap'], result => {
  if (result.gradeMap && !domainDefaults[currentDomain]) {
    // 配列形式ならオブジェクトに変換
    if (Array.isArray(result.gradeMap)) {
      gradeMapArr = result.gradeMap;
      gradeMap = Object.fromEntries(gradeMapArr.map(item => [item.symbol, item.value]));
    } else if (typeof result.gradeMap === 'object') {
      // 旧形式（オブジェクト）の場合も対応
      gradeMap = result.gradeMap;
      gradeMapArr = Object.entries(gradeMap).map(([symbol, value]) => ({ symbol, value }));
    }
  }
});

chrome.storage?.local.get(['classToKey'], result => {
  if (result.classToKey && !domainDefaults[currentDomain]) {
    classToKey = result.classToKey;
  }
});

// 以降はgradeMapArr, gradeMap, classToKeyをそのまま利用
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- figure =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function keepFigure() {
    let data = correctData();
    // topLevelKey, kubunTypes, gradeLabels の取得
    let topLevelKey = getTopLevelKey();
    let kubunTypes = getLevelTypes(topLevelKey);

    // gradeMapのキーを利用して成績区分を動的に生成
    let gradeLabels = Object.keys(gradeMap).filter(k => k !== "");

    // データ集計
    let preSortedData = data.reduce((acc, sub) => {
        let key = sub.year + sub.term;
        if (!acc[key]) {
            acc[key] = {};
            kubunTypes.forEach(type => {
                acc[key][type] = {
                    creditSum: 0,
                    creditSumAll: 0,
                    gpSum: 0,
                    grade: {}
                };
                gradeLabels.forEach(label => {
                    acc[key][type].grade[label] = 0;
                });
            });
        }
        let kubun = sub[topLevelKey];
        if (!kubunTypes.includes(kubun)) return acc;
        acc[key][kubun].creditSumAll += Number(sub.credit);
        if (sub.gpaScope == '○' && sub.grade !== '') {
            acc[key][kubun].creditSum += Number(sub.credit);
        }
        if (sub.grade !== '') {
            acc[key][kubun].gpSum += Number(sub.credit) * convGrade(sub.grade);
            if (gradeLabels.includes(sub.grade)) {
                acc[key][kubun].grade[sub.grade] += Number(sub.credit);
            }
        }
        return acc;
    }, {});

    let sortedKeys = Object.keys(preSortedData).sort();
    let sortedData = {};
    sortedKeys.forEach(key => {
        sortedData[key] = preSortedData[key];
    });

    let labels = Object.keys(sortedData);

    // 区分ごとに配列を用意
    let creditSums = {};
    let creditSumsAll = {};
    let gpas = {};
    kubunTypes.forEach(type => {
        creditSums[type] = [];
        creditSumsAll[type] = [];
        gpas[type] = [];
    });
    let totalGpa = [];
    let cumulGpa = [];
    let cumulGp = 0;
    let cumulCredit = 0;

    for (let key of Object.keys(sortedData)) {
        let totalGpSum = 0;
        let totalCreditSum = 0;
        kubunTypes.forEach(type => {
            const obj = sortedData[key][type] || {};
            creditSums[type].push(obj.creditSum || 0);
            creditSumsAll[type].push(obj.creditSumAll || 0);
            let gpaVal = (obj.gpSum && obj.creditSum) ? (obj.gpSum / obj.creditSum).toFixed(2) : null;
            gpas[type].push(gpaVal);
            totalGpSum += obj.gpSum || 0;
            totalCreditSum += obj.creditSum || 0;
        });
        if (totalGpSum !== 0 && totalCreditSum !== 0) {
            totalGpa.push((totalGpSum / totalCreditSum).toFixed(2));
            cumulCredit += totalCreditSum;
            cumulGp += totalGpSum;
            cumulGpa.push((cumulGp / cumulCredit).toFixed(2));
        } else {
            totalGpa.push(null);
            cumulGpa.push(null);
        }
    }

    // 表示用データ生成
    let dataTable = [];
    labels.forEach((label, index) => {
        let row = [label];
        kubunTypes.forEach(type => {
            row.push((creditSums[type][index] || 0) + ' / ' + (creditSumsAll[type][index] || 0));
        });
        kubunTypes.forEach(type => {
            row.push(gpas[type][index] !== null && gpas[type][index] !== undefined ? gpas[type][index] : '-');
        });
        row.push(totalGpa[index] !== null && totalGpa[index] !== undefined ? totalGpa[index] : '-');
        row.push(cumulGpa[index] !== null && cumulGpa[index] !== undefined ? cumulGpa[index] : '-'); // 累積GPAを追加
        dataTable.push(row);
    });

    // 列名も動的に
    let columns = ['年度'];
    kubunTypes.forEach(type => columns.push(type + '単位'));
    kubunTypes.forEach(type => columns.push(type + 'GPA'));
    columns.push('合計GPA');
    columns.push('累積GPA'); // 累積GPA列を追加

    // 成績分布テーブル
    let gradeData = [];
    labels.forEach(label => {
        // 年度ごとに全区分の合計を集計
        let totalGrades = {};
        gradeLabels.forEach(label => {
            totalGrades[label] = 0;
        });
        // let totalGrades = { 'AA': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0 };
        kubunTypes.forEach(type => {
            const gradeObj = (sortedData[label][type] && sortedData[label][type].grade) ? sortedData[label][type].grade : {};
            gradeLabels.forEach(g => {
                totalGrades[g] += gradeObj[g] || 0;
            });
        });
        gradeData.push([
            label,
            ...gradeLabels.map(g => totalGrades[g])
        ]);
    });

    // 合計行（全年度合計）
    let totalGradesAll = {};
    gradeLabels.forEach(label => {
        totalGradesAll[label] = 0;
    });
    // let totalGradesAll = { 'AA': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0 };
    labels.forEach(label => {
        kubunTypes.forEach(type => {
            const gradeObj = (sortedData[label][type] && sortedData[label][type].grade) ? sortedData[label][type].grade : {};
            gradeLabels.forEach(g => {
                totalGradesAll[g] += gradeObj[g] || 0;
            });
        });
    });
    gradeData.push([
        '合計',
        ...gradeLabels.map(g => totalGradesAll[g])
    ]);

    // 表示部分
    let targ = document.querySelector('#funcForm > hr.ui-separator.ui-state-default.ui-corner-all');
    let sibling = targ.nextElementSibling;
    let found = false;
    let container;
    let minicontainer;
    let subcontainer;
    let figure;
    while (sibling) {
        if (sibling.tagName.toLowerCase() === 'div' && sibling.getAttribute('data-added-by') === 'me') {
            found = true;
            container = sibling;
            break;
        }
        sibling = sibling.nextElementSibling;
    }
    if (found == false) {
        container = document.createElement('div');
        container.id = 'figureContainer';
        container.setAttribute('data-added-by', 'me');
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '1fr 1fr';
        container.style.alignItems = 'flex-start';
        container.style.gap = '5px';
        container.style.width = '100%';
        container.style.maxWidth = '100%';
        container.style.width = 'auto';
        container.style.boxSizing = 'border-box';
        container.style.margin = 'auto auto';
        container.style.padding = '10px 10px';
        container.style.border = '1px solid #ccc';
        container.style.borderRadius = '5px';
        container.style.backgroundColor = '#f9f9f9';
        container.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        container.style.position = 'relative';
        // container.style.zIndex = '9999';
        container.style.overflow = 'auto';
        // container.style.maxWidth = '100%';
        // container.style.maxHeight = '100%';
        container.style.overflowY = 'auto';
        // container.style.overflowX = 'hidden';
        container.style.fontSize = '14px';
        container.style.lineHeight = '1.5';
        container.style.color = '#333';
        container.style.height = '50vh';
        minicontainer = document.createElement('div');
        minicontainer.id = 'minicontainer';
        container.appendChild(minicontainer);
        // minicontainer.style.width = '40vw';
        minicontainer.style.width = '100%';
        minicontainer.style.height = '100%';
        minicontainer.style.maxWidth = '100%';
        minicontainer.style.margin = '0';
        // minicontainer.style.flex = '1 1 auto';
        minicontainer.style.gridRow = '1';
        minicontainer.style.display = 'flex';
        minicontainer.style.justifyContent = 'center';
        minicontainer.style.alignItems = 'center';
        // minicontainer.style.margin = '0 auto';
        targ.after(container);
        subcontainer = document.createElement('div');
        subcontainer.id = 'subcontainer';
        container.appendChild(subcontainer);
        // subcontainer.style.width = '40vw';
        subcontainer.style.width = '100%';
        subcontainer.style.height = '100%';
        subcontainer.style.maxWidth = '100%';
        subcontainer.style.margin = '0';
        // subcontainer.style.flex = '1 1 auto';
        subcontainer.style.gridRow = '2';
        // subcontainer.style.marginBottom = '10px';
        subcontainer.style.display = 'flex';
        subcontainer.style.justifyContent = 'center';
        subcontainer.style.alignItems = 'center';
        targ.after(container);

        // figure用のリサイズ用コンテナを作成
        const figureresizecontainer = document.createElement('div');
        figureresizecontainer.id = 'figureresizecontainer';
        figureresizecontainer.style.width = '100%';
        figureresizecontainer.style.height = '100%';
        figureresizecontainer.style.display = 'flex';
        figureresizecontainer.style.alignItems = 'center';
        figureresizecontainer.style.justifyContent = 'center';
        figureresizecontainer.style.gridRow = '1';

        // figure(canvas)を作成
        figure = document.createElement('canvas');
        figure.id = 'gpaChart';
        figure.setAttribute('data-added-by', 'me');
        figure.style.maxWidth = '100%';
        figure.style.display = 'block';
        figure.style.boxSizing = 'border-box';
        figure.style.flex = '1 1 auto';

        // figureresizecontainerにfigureを追加
        figureresizecontainer.appendChild(figure);

        // containerにfigureresizecontainerを追加
        container.appendChild(figureresizecontainer);

        targ.after(container);

        // 幅取得後に高さを幅の1/4に設定
        requestAnimationFrame(() => {
            const w = figureresizecontainer.offsetWidth || 400;
            const h = Math.floor(w / 4);
            figure.style.width = w + 'px';
            figure.style.height = h + 'px';
            figure.width = w;
            figure.height = h;
        });
    } else {
        minicontainer = container.querySelector('#minicontainer');
        subcontainer = container.querySelector('#subcontainer');
        figure = container.querySelector('#gpaChart');
        minicontainer.innerHTML = '';
        subcontainer.innerHTML = '';
        figure.innerHTML = '';
    }

    // テーブル表示
    new gridjs.Grid({
        columns: columns,
        data: dataTable,
        style: {
            th: {
                border: '1px solid #ddd',
                padding: '2px',
                backgroundColor: '#f2f2f2',
                textAlign: 'center',
                whiteSpace: 'normal',
                wordBreak: 'break-all',
                width: 'auto',
                maxWidth: '4rem',
            },
            td: {
                border: '1px solid #ddd',
                padding: '2px',
                textAlign: 'center',
                height: '4.5vh',
                // width: '3vw',
                // minWidth: '3em',
                whiteSpace: 'normal',
                wordBreak: 'break-all',
                maxWidth: '4rem',
            },
            table: {
                'font-size': '15px',
                // marginRight: '3px',
                maxWidth: '100%',
                tableLayout: 'fixed',
                width: '100%',
                height: '100%',
            }
        }
    }).render(minicontainer);

    // 成績分布テーブル
    new gridjs.Grid({
        columns: ['年度', ...gradeLabels],
        data: gradeData,
        style: {
            th: {
                border: '1px solid #ddd',
                padding: '2px',
                backgroundColor: '#f2f2f2',
                textAlign: 'center',
                whiteSpace: 'normal',
                wordBreak: 'break-all',
                width: 'auto',
                maxWidth: '4rem',
            },
            td: {
                border: '1px solid #ddd',
                padding: '2px',
                textAlign: 'center',
                height: '4.5vh',
                // width: '3vw',
                // minWidth: '3em',
                whiteSpace: 'normal',
                wordBreak: 'break-all',
                maxWidth: '4rem',
            },
            table: {
                'font-size': '15px',
                // marginRight: '3px',
                maxWidth: '100%',
                tableLayout: 'fixed',
                width: '100%',
                height: '100%',
            }
        }
    }).render(subcontainer);

    // グラフ描画
    let gpaScale = [];
    kubunTypes.forEach(type => {
        gpaScale = gpaScale.concat(gpas[type]);
    });
    gpaScale = gpaScale.concat(totalGpa, cumulGpa);
    gpaScale = gpaScale.filter(gpa => gpa !== null);

    let datasets = [];
    kubunTypes.forEach(type => {
        datasets.push({
            label: type + '単位',
            data: creditSums[type],
            borderWidth: 1,
            yAxisID: 'y-axis-0',
            type: 'bar'
        });
    });
    kubunTypes.forEach(type => {
        datasets.push({
            label: type + 'GPA',
            data: gpas[type],
            borderWidth: 2,
            yAxisID: 'y-axis-1',
            type: 'line'
        });
    });
    datasets.push({
        label: '合計GPA',
        data: totalGpa,
        borderWidth: 2,
        yAxisID: 'y-axis-1',
        type: 'line'
    });
    datasets.push({
        label: '累積GPA',
        data: cumulGpa,
        borderWidth: 2,
        yAxisID: 'y-axis-1',
        type: 'line'
    });

    let minGpa = Math.min(...gpaScale);
    let maxGpa = Math.max(...gpaScale);

    if (found==false) {
        new Chart(figure, {
            type: 'bar',
            plugins: [ChartDataLabels],
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                layout: {
                    padding: {
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    'y-axis-0': {
                        type: 'linear',
                        position: 'left',
                        stacked: true,
                        beginAtZero: true,
                    },
                    'y-axis-1': {
                        type: 'linear',
                        position: 'right',
                        beginAtZero: false,
                    }
                },
                plugins: {
                    datalabels: {
                        display: false,
                        align: 'top',
                        anchor: 'end',
                        font: {
                            size: 13,
                            color: 'black'
                        },
                        formatter: function (value, context) {
                            return value !== (null || 0) ? value.toString() : '';
                        }
                    }
                },
                maintainAspectRatio: false,
                responsive: true,
            }
        });
    }
}

// const classToKey = {
//     colRishu: ["now"],
//     colKmkName: ["level2", "level3","combined", "subject"],
//     colTani: ["credit"],
//     colHyoka: ["grade"],
//     colGpaTgt: ["gpaScope"],
//     colNendo: ["year"],
//     colGakki: ["term"],
//     colKyuinName: ["teacher"],
// };

// chrome.storage?.local.get(['classToKey'], result => {
//   if (result.classToKey) classToKey = result.classToKey;
// });

function correctData(){
    let elements = document.querySelectorAll('.ui-datatable.ui-widget.min-width.sskTable.ui-datatable-resizable');
    let data = [];
    let classList = [];
    let keyOrder = [];
    let isSingle;
    if(document.getElementById('funcForm:initPtn:0').checked==true){
        isSingle=true;
    }
    else{
        isSingle=false;
    }
    // console.log(isSingle);
    if (elements.length > 0) {
        elements.forEach(element => {
            let rows=element.querySelectorAll('[role="row"');
            let isFirstIteration = true;
            let level1, level2, level3, level4, level5, level6, now, subject, credit, grade, gpaScope, year, term, teacher;
            let termElement=element.previousElementSibling;
            term=termElement.textContent;
            let fixedwordElement=termElement.previousElementSibling;
            let nendoEelement=fixedwordElement.previousElementSibling;
            year=nendoEelement.textContent;
            rows.forEach(row => {
                if(isFirstIteration==true){
                    let isFirst=true;
                    headers=row.querySelectorAll('[role="columnheader"]');
                    headers.forEach(header => {
                        if(isFirst==true){
                            isFirst=false;
                        }
                        let classAttr=header.className.split(' ').find(cls => cls.startsWith('col'));
                        // console.log(classAttr);
                        classList.push(classAttr);
                    });
                    isFirstIteration=false;
                }
                else{
                    let subjectName=row.querySelector('[class^="colKmkName"]');
                    if(subjectName.className=="colKmkName alignCenter kamokuLevel1"){
                        level1=subjectName.textContent;
                        level2="";
                        level3="";
                        level4="";
                        level5="";
                        level6="";
                    }
                    else if(subjectName.className=="colKmkName alignCenter kamokuLevel2"){
                        level2=subjectName.textContent;
                        level3="";
                        level4="";
                        level5="";
                        level6="";
                    }
                    else if(subjectName.className=="colKmkName alignCenter kamokuLevel3"){
                        level3=subjectName.textContent;
                        level4="";
                        level5="";
                        level6="";
                    }
                    else if(subjectName.className=="colKmkName alignCenter kamokuLevel4"){
                        level4=subjectName.textContent;
                        level5="";
                        level6="";
                    }
                    else if(subjectName.className=="colKmkName alignCenter kamokuLevel5"){
                        level5=subjectName.textContent;
                        level6="";
                    }
                    else if(subjectName.className=="colKmkName alignCenter kamokuLevel6"){
                        level6=subjectName.textContent;
                    }
                    else{
                        now = row.querySelector('[class^="colRishu"]') ? row.querySelector('[class^="colRishu"]').textContent : '';
                        subject = subjectName ? subjectName.textContent : '';
                        credit = row.querySelector('[class^="colTani"]') ? row.querySelector('[class^="colTani"]').textContent : '';
                        score = row.querySelector('[class^="colSoten"]') ? row.querySelector('[class^="colSoten"]').textContent : '';
                        grade = row.querySelector('[class^="colHyoka"]') ? row.querySelector('[class^="colHyoka"]').textContent : '';
                        gpaScope = row.querySelector('[class^="colGpaTgt"]') ? row.querySelector('[class^="colGpaTgt"]').textContent : '';
                        if(isSingle==true){
                            year = row.querySelector('[class^="colNendo"]') ? row.querySelector('[class^="colNendo"]').textContent : '';
                            term = row.querySelector('[class^="colGakki"]') ? row.querySelector('[class^="colGakki"]').textContent : '';
                        }
                        attendance = row.querySelector('[class^="colAttendRatio"]') ? row.querySelector('[class^="colAttendRatio"]').textContent : '';
                        teacher = row.querySelector('[class^="colKyuinName"]') ? row.querySelector('[class^="colKyuinName"]').textContent : '';
                        let combined;
                        if(level6==""){
                            if(level5==""){
                                if(level4==""){
                                    combined="";
                                }
                                else{
                                    combined=level4;
                                }
                            }
                            else{
                                combined=level5;
                            }
                        }
                        else{
                            combined=level6;
                        }
                        // data.push([now,level2,level3,combined,subject,credit,grade,gpaScope,year,term,teacher]);
                        // data.push({
                        //     now: now,
                        //     level2: level2,
                        //     level3: level3,
                        //     combined: combined,
                        //     subject: subject,
                        //     credit: credit,
                        //     grade: grade,
                        //     gpaScope: gpaScope,
                        //     year: year,
                        //     term: term,
                        //     teacher: teacher
                        // });
                        let values = {
                            now: now,
                            level1: level1,
                            level2: level2,
                            level3: level3,
                            level4: level4,
                            level5: level5,
                            level6: level6,
                            combined: combined,
                            subject: subject,
                            score: score,
                            credit: credit,
                            grade: grade,
                            gpaScope: gpaScope,
                            attendance: attendance,
                            year: year,
                            term: term,
                            teacher: teacher
                        };
                        // console.log(values);
                        let rowObj = {}
                        keyOrder = [];
                        classList.forEach(cls => {
                            if (classToKey[cls]) {
                                classToKey[cls].forEach(key => {
                                    if (values[key]!==undefined) {
                                        // console.log(values[key]);
                                        rowObj[key] = values[key];
                                        keyOrder.push(key);
                                    }
                                    // 何も代入しない場合はrowObjにプロパティが追加されません
                                });
                            }
                        });
                        if (!isSingle) {
                            rowObj.year = year;
                            rowObj.term = term;
                            keyOrder.push('year');
                            keyOrder.push('term');
                        }
                        // console.log(rowObj);
                        data.push(rowObj);
                    }
                }
            });
        });
    }
    data.keyOrder = keyOrder;
    // console.log(data.classList);
    return data;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= csv =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function addButton(){
    let targ = document.querySelector('#funcForm > div.searchArea.min-width > span.btnPDFLocation > button:nth-child(1)');
    let sibling = targ.nextElementSibling;
    let found = false;
    while (sibling) {
        if (sibling.tagName.toLowerCase() === 'button' && sibling.getAttribute('data-added-by') === 'me') {
            found = true;
            break;
        }
        sibling = sibling.nextElementSibling;
    }
    if(found==true){
        return;
    }
    let pcsv = document.createElement('button')
    pcsv.setAttribute('data-added-by', 'me');
    pcsv.style="float:right;margin-left: 5px;";
    pcsv.className='ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only';
    let span=document.createElement('span');
    span.className='ui-button-text ui-c';
    span.textContent="XLSX";
    pcsv.appendChild(span);
    pcsv.addEventListener('click',function(){
        downloadcsv()
    });
    targ.after(pcsv);
}

const keyToHeader = {
    now: "履修中",
    level1: "区分深度1",
    level2: "区分深度2",
    level3: "区分深度3",
    level4: "区分深度4",
    level5: "区分深度5",
    level6: "区分深度6",
    combined: "区分深度4",
    subject: "科目",
    credit: "単位数",
    score: "素点",
    grade: "評価",
    gpaScope: "GPA対象",
    attendance: "出席率",
    year: "年度",
    term: "学期",
    teacher: "教員氏名"
};

function downloadcsv(){
    let data = correctData(); // ここで全データを取得
    let book = XLSX.utils.book_new();

    // ヘッダー（サイト表示順に合わせて）
    const header = data.keyOrder.map(key => keyToHeader[key] || key);
    // console.log(header);
    // const header = ["履修中","区分深度2","区分深度3","区分深度4","科目","単位数","評価","GPA対象","年度","学期","教員氏名"];

    let sheetData = [header];
    data.forEach(row => {
        let sheetValues = [];
        data.keyOrder.forEach(key => {
            sheetValues.push(row[key]);
        });
        sheetData.push(sheetValues);
    });
    let sheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(book, sheet, "通算");

    // 年度・学期ごとにまとめる
    let grouped = {};
    data.forEach(row => {
        let key = row.year + row.term;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
    });

    Object.keys(grouped).forEach(key => {
        let rows = grouped[key];
        let sheetData = [header];
        rows.forEach(row => {
            let sheetValues = [];
            data.keyOrder.forEach(key => {
                sheetValues.push(row[key]);
            });
            sheetData.push(sheetValues);
        });
        let sheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(book, sheet, rows[0].year + "年度" + rows[0].term);
    });

    let binary = XLSX.write(book, { type: 'array' });
    let blob = new Blob([binary], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    let fileName = "credit-new-term.xlsx";
    let objectUrl = URL.createObjectURL(blob);
    let downloadLink = document.createElement("a");
    downloadLink.download = fileName;
    downloadLink.href = objectUrl;
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(objectUrl);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- table -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

let targetNode = document.documentElement;
const config = {
    attributes: false,
    childList: true,
    subtree: true,
    characterData: false,
    attributeOldValue: false,
    characterDataOldValue: false
};

let debounceTimer;

// let gradeMapArr = [
//   { symbol: "ＡＡ", value: 4.0 },
//   { symbol: "Ａ", value: 3.0 },
//   { symbol: "Ｂ", value: 2.0 },
//   { symbol: "Ｃ", value: 1.0 },
//   { symbol: "Ｄ", value: 0.0 },
//   { symbol: "Ｅ", value: 0.0 },
//   { symbol: "", value: undefined }
// ];

// // オブジェクト形式も用意
// let gradeMap = Object.fromEntries(gradeMapArr.map(item => [item.symbol, item.value]));

// // storageから取得して両方更新
// chrome.storage?.local.get(['gradeMap'], result => {
//   if (result.gradeMap) {
//     // 配列形式ならオブジェクトに変換
//     if (Array.isArray(result.gradeMap)) {
//       gradeMapArr = result.gradeMap;
//       gradeMap = Object.fromEntries(gradeMapArr.map(item => [item.symbol, item.value]));
//     } else if (typeof result.gradeMap === 'object') {
//       // 旧形式（オブジェクト）の場合も対応
//       gradeMap = result.gradeMap;
//       gradeMapArr = Object.entries(gradeMap).map(([symbol, value]) => ({ symbol, value }));
//     }
//   }
// });

// 既存のconvGradeやObject.keys(gradeMap)はそのまま使える
function convGrade(char, map = gradeMap) {
  return map.hasOwnProperty(char) ? map[char] : 0.0;
}

function makeTable(element,grade){
    let sibling = element.nextElementSibling;
    let found = false;
    while (sibling) {
        if (sibling.tagName.toLowerCase() === 'table' && sibling.getAttribute('data-added-by') === 'me') {
            found = true;
            break;
        }
        sibling = sibling.nextElementSibling;
    }
    if(found==true){
        sibling.remove();
    }
    let table=document.createElement('table');
    table.style="margin: 0 0 0 auto;";
    table.setAttribute('data-added-by', 'me');
    let thead=document.createElement('thead');
    let tr=document.createElement('tr');
    let th1=document.createElement('th');
    th1.classList.add("ui-state-default","ui-resizable-column","alignCenter");
    th1.style="width: 69px;";
    th1.textContent="履修単位";
    tr.appendChild(th1);
    let th2=document.createElement('th');
    th2.classList.add("ui-state-default","ui-resizable-column","alignCenter");
    th2.style="width: 69px;";
    th2.textContent="GPA対象";
    tr.appendChild(th2);
    let th3=document.createElement('th');
    th3.classList.add("ui-state-default","ui-resizable-column","alignCenter");
    th3.style="width: 69px;";
    th3.textContent="修得単位";
    tr.appendChild(th3);
    let th4=document.createElement('th');
    th4.classList.add("ui-state-default","ui-resizable-column","alignCenter");
    th4.style="width: 69px;";
    th4.textContent="GPA";
    tr.appendChild(th4);
    thead.appendChild(tr);
    table.appendChild(thead);
    let tbody=document.createElement('tbody');
    let tr2=document.createElement('tr');
    tr2.classList.add("ui-widget-content","ui-datatable-even");
    tr2.role="row";
    let td1=document.createElement('th');
    td1.classList.add("ui-state-default","ui-resizable-column","alignCenter");
    td1.style="width: 69px;";
    td1.textContent=grade[0];
    tr2.appendChild(td1);
    let td2=document.createElement('th');
    td2.classList.add("ui-state-default","ui-resizable-column","alignCenter");
    td2.style="width: 69px;";
    td2.textContent=grade[1];
    tr2.appendChild(td2);
    let td3=document.createElement('th');
    td3.classList.add("ui-state-default","ui-resizable-column","alignCenter");
    td3.style="width: 69px;";
    td3.textContent=grade[2];
    tr2.appendChild(td3);
    let td4=document.createElement('th');
    td4.classList.add("ui-state-default","ui-resizable-column","alignCenter");
    td4.style="width: 69px;";
    td4.textContent=grade[3];
    tr2.appendChild(td4);
    tbody.appendChild(tr2);
    table.appendChild(tbody);
    element.after(table);
};

function createCheckbox(id, labelText, controlId, initialChecked, onChangeCallback) {
    const containerDiv = document.createElement('div');
    containerDiv.id = id;
    containerDiv.className = 'ui-chkbox ui-widget';
    containerDiv.setAttribute('data-added-by', 'me');

    const helperDiv = document.createElement('div');
    helperDiv.className = 'ui-helper-hidden-accessible';

    const inputElement = document.createElement('input');
    inputElement.id = `${id}_input`;
    inputElement.name = `${id}_input`;
    inputElement.type = 'checkbox';
    inputElement.checked = initialChecked;
    inputElement.setAttribute('aria-checked', initialChecked ? 'true' : 'false');
    inputElement.setAttribute('data-p-con', 'javax.faces.Boolean');
    inputElement.setAttribute('data-p-hl', 'booleanchkbox');
    inputElement.setAttribute('control-id', controlId);

    helperDiv.appendChild(inputElement);

    const checkboxBoxDiv = document.createElement('div');
    checkboxBoxDiv.className = `ui-chkbox-box ui-widget ui-corner-all ui-state-default ${initialChecked ? 'ui-state-active' : ''}`;
    checkboxBoxDiv.addEventListener('click', function () {
        inputElement.checked = !inputElement.checked;
        inputElement.setAttribute('aria-checked', inputElement.checked ? 'true' : 'false');
        checkboxIconSpan.className = 'ui-chkbox-icon ui-icon ' + (inputElement.checked ? 'ui-icon-check' : 'ui-icon-blank');
        onChangeCallback(inputElement.checked);
    });

    const checkboxIconSpan = document.createElement('span');
    checkboxIconSpan.className = 'ui-chkbox-icon ui-icon ui-c ' + (initialChecked ? 'ui-icon-check' : 'ui-icon-blank');

    checkboxBoxDiv.appendChild(checkboxIconSpan);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'ui-chkbox-label';
    labelSpan.textContent = labelText;

    containerDiv.appendChild(helperDiv);
    containerDiv.appendChild(checkboxBoxDiv);
    containerDiv.appendChild(labelSpan);

    return containerDiv;
}

/**
 * データ内で最も上位（小さいN）のlevelKeyを自動で取得
 * @returns {string} 例: "level1" や "level2"
 */
function getTopLevelKey() {
    const data = correctData();
    const levelKeys = ["level1", "level2", "level3", "level4", "level5", "level6"];
    for (let key of levelKeys) {
        if (data.some(row => row[key] && row[key] !== "")) {
            return key;
        }
    }
    // どれもなければデフォルト
    return "level1";
}

/**
 * 指定したlevelN（例: "level2"や"level1"）のユニーク値をcorrectDataから抽出
 * @param {string} levelKey - 例: "level2" や "level1"
 * @returns {Array<string>}
 */
function getLevelTypes(levelKey = getTopLevelKey()) {
    const data = correctData();
    const types = new Set();
    data.forEach(row => {
        if (row[levelKey]) types.add(row[levelKey]);
    });
    return Array.from(types);
}

// 指定したlevelの要素ごとに表示切替用のフラグを持つ
let showLevel = {};

/**
 * levelKeyで指定した区分（例: level2, level1）ごとにチェックボックスを生成
 * @param {string} levelKey - 例: "level2" や "level1"
 */
function addCheckbox(levelKey = getTopLevelKey()) {
    let container = document.createElement('div');
    container.id = 'fullWidthContainer';
    container.style.width = '100%';
    container.style.boxSizing = 'border-box';

    let targetNode = document.querySelector('#funcForm hr');
    let sibling = targetNode.nextElementSibling;
    let found = false;
    while (sibling) {
        if (sibling.tagName.toLowerCase() === 'table' && sibling.getAttribute('data-added-by') === 'me') {
            found = true;
            break;
        }
        sibling = sibling.nextElementSibling;
    }
    if (found) {
        return;
    }

    // 指定したlevelの種類を取得
    const levelTypes = getLevelTypes(levelKey);
    // 初期値セット
    levelTypes.forEach(type => {
        if (!(type in showLevel)) showLevel[type] = true;
    });

    const descriptionText = document.createElement('div');
    descriptionText.id = 'descriptionText';
    descriptionText.textContent = '表示切替';
    descriptionText.className = 'description-text';
    container.appendChild(descriptionText);

    // 各lavelごとにチェックボックスを生成
    levelTypes.forEach(type => {
        const checkbox = createCheckbox(
            `checkbox_${type}`,
            type,
            `ControlID-${type}`,
            showLevel[type],
            (checked) => {
                showLevel[type] = checked;
                let elements = document.querySelectorAll('.ui-datatable.ui-widget.min-width.sskTable.ui-datatable-resizable');
                if (elements.length > 0) {
                    observer.disconnect();
                    elements.forEach(element => {
                        let grade = gpaCal(element);
                        makeTable(element, grade);
                    });
                    observer.observe(targetNode, config);
                }
            }
        );
        container.appendChild(checkbox);
    });

    container.style.display = 'flex';
    container.style.justifyContent = 'space-around';
    container.style.alignItems = 'center';
    container.style.padding = '10px 0';
    container.style.backgroundColor = '#f9f9f9';
    container.style.border = '1px solid #ccc';
    container.style.borderRadius = '5px';
    container.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    container.style.marginTop = '10px';
    container.style.marginBottom = '10px';
    container.style.fontSize = '14px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#333';
    container.style.fontWeight = 'bold';
    container.style.textAlign = 'center';
    container.style.width = '100%';
    container.style.boxSizing = 'border-box';
    container.style.padding = '10px 20px';

    targetNode.after(container);
}

// gpaCalのlevelKey対応
function gpaCal(element, levelKey = getTopLevelKey()) {
    rows = element.querySelectorAll('[role="row"');
    let gpSum = 0;
    let creditSum = 0;
    let gpCreditSum = 0;
    let acceptedSum = 0;
    let isFirstIteration = true;
    // level情報を辞書型で管理
    let levels = {
        level1: "",
        level2: "",
        level3: "",
        level4: "",
        level5: "",
        level6: ""
    };
    rows.forEach(row => {
        if (isFirstIteration == true) {
            let isFirst = true;
            headers = row.querySelectorAll('[role="columnheader"]');
            headers.forEach(header => {
                if (isFirst == true) {
                    isFirst = false;
                }
            });
            isFirstIteration = false;
        }
        else {
            row.style.display = "";
            let subjectName = row.querySelector('[class^="colKmkName"]');
            // 各levelNの値をセット（辞書型で管理）
            if (subjectName.className == "colKmkName alignCenter kamokuLevel1") {
                levels.level1 = subjectName.textContent;
                levels.level2 = "";
                levels.level3 = "";
                levels.level4 = "";
                levels.level5 = "";
                levels.level6 = "";
                if (showLevel[levels[levelKey]] === false) {
                    row.style.display = "none";
                }
            }
            else if (subjectName.className == "colKmkName alignCenter kamokuLevel2") {
                levels.level2 = subjectName.textContent;
                levels.level3 = "";
                levels.level4 = "";
                levels.level5 = "";
                levels.level6 = "";
                if (showLevel[levels[levelKey]] === false) {
                    row.style.display = "none";
                }
            }
            else if (subjectName.className == "colKmkName alignCenter kamokuLevel3") {
                levels.level3 = subjectName.textContent;
                levels.level4 = "";
                levels.level5 = "";
                levels.level6 = "";
                if (showLevel[levels[levelKey]] === false) {
                    row.style.display = "none";
                }
            }
            else if (subjectName.className == "colKmkName alignCenter kamokuLevel4") {
                levels.level4 = subjectName.textContent;
                levels.level5 = "";
                levels.level6 = "";
                if (showLevel[levels[levelKey]] === false) {
                    row.style.display = "none";
                }
            }
            else if (subjectName.className == "colKmkName alignCenter kamokuLevel5") {
                levels.level5 = subjectName.textContent;
                levels.level6 = "";
                if (showLevel[levels[levelKey]] === false) {
                    row.style.display = "none";
                }
            }
            else if (subjectName.className == "colKmkName alignCenter kamokuLevel6") {
                levels.level6 = subjectName.textContent;
                if (showLevel[levels[levelKey]] === false) {
                    row.style.display = "none";
                }
            }
            else {
                if (showLevel[levels[levelKey]] === false) {
                    row.style.display = "none";
                    return;
                }
                let gpaTgt = row.querySelector('[class^="colGpaTgt"]');
                let tani = row.querySelector('[class^="colTani"]');
                let credit = Number(tani.textContent);
                let hyoka = row.querySelector('[class^="colHyoka"]');
                if (gpaTgt) {
                    if (gpaTgt.textContent != "○") {
                        creditSum += credit;
                        if (hyoka && hyoka.textContent != "") {
                            acceptedSum += credit;
                        }
                        return;
                    }
                }
                if (hyoka && hyoka.textContent != "") {
                    let gp = convGrade(hyoka.textContent);
                    if (gp == undefined) {
                        creditSum += credit;
                    }
                    else {
                        gpSum += gp * credit;
                        creditSum += credit;
                        gpCreditSum += credit;
                        acceptedSum += credit;
                    }
                }
                else {
                    creditSum += credit;
                }
            }
        }
    });
    let gpa = gpSum / gpCreditSum;
    if (gpSum == 0) {
        gpa = "-";
    }
    else {
        gpa = Math.round(gpa * 100) / 100;
    }
    return [creditSum.toFixed(1), gpCreditSum.toFixed(1), acceptedSum.toFixed(1), gpa];
}

const callback = function(mutationsList, observer) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
        let elements = document.querySelectorAll('.ui-datatable.ui-widget.min-width.sskTable.ui-datatable-resizable');
        if (elements.length > 0) {
            observer.disconnect();
            let button = document.querySelector('button#funcForm\\:search');
            button.addEventListener('click', function(event) {
                observer.disconnect();
                showGeneral=true;
                showProfessional=true;
                addCheckbox();
                targetNode = document.documentElement;
                observer = new MutationObserver(callback);
                observer.observe(targetNode, config);
            });
            addButton();
            addCheckbox();
            keepFigure(elements);
            elements.forEach(element => {
                let grade=gpaCal(element);
                makeTable(element,grade);
            });
            observer.observe(targetNode, config);
        }
    }, 100);
};

let observer = new MutationObserver(callback);
observer.observe(targetNode, config);
