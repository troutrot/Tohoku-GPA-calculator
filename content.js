// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- figure =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function keepFigure(){
    let data = correctData();
    let preSortedData = data.reduce((acc, sub) => {
        let key = sub[8] + sub[9];
        if (!acc[key]) {
            acc[key] = [];
            acc[key]['genCreditSum'] = 0;
            acc[key]['genCreditSumAll'] = 0;
            acc[key]['genGpSum'] = 0;
            acc[key]['spcCreditSum'] = 0;
            acc[key]['spcCreditSumAll'] = 0;
            acc[key]['spcGpSum'] = 0;
            acc[key]['grade'] = {
                'AA': 0,
                'A': 0,
                'B': 0,
                'C': 0,
                'D': 0,
                'E': 0
            };
        }
        if (sub[1] === '全学教育科目') {
            acc[key]['genCreditSumAll'] += Number(sub[5]);
            if (sub[7] == '○') {
                acc[key]['genCreditSum'] += Number(sub[5]);
            }
            if (sub[6] !== '') {
                acc[key]['genGpSum'] += Number(sub[5]) * convGrade(sub[6]);
                if(sub[6]=="ＡＡ"){
                    acc[key]['grade']['AA'] += Number(sub[5]);
                }
                else if(sub[6]=="Ａ"){
                    acc[key]['grade']['A'] += Number(sub[5]);
                }
                else if(sub[6]=="Ｂ"){
                    acc[key]['grade']['B'] += Number(sub[5]);
                }
                else if(sub[6]=="Ｃ"){
                    acc[key]['grade']['C'] += Number(sub[5]);
                }
                else if(sub[6]=="Ｄ"){
                    acc[key]['grade']['D'] += Number(sub[5]);
                }
                else if(sub[6]=="Ｅ"){
                    acc[key]['grade']['E'] += Number(sub[5]);
                }
            }
        }
        else {
            acc[key]['spcCreditSumAll'] += Number(sub[5]);
            if (sub[7] == '○') {
                acc[key]['spcCreditSum'] += Number(sub[5]);
            }
            if (sub[6] !== '') {
                acc[key]['spcGpSum'] += Number(sub[5]) * convGrade(sub[6]);
            }
            if(sub[6]=="ＡＡ"){
                acc[key]['grade']['AA'] += Number(sub[5]);
            }
            else if(sub[6]=="Ａ"){
                acc[key]['grade']['A'] += Number(sub[5]);
            }
            else if(sub[6]=="Ｂ"){
                acc[key]['grade']['B'] += Number(sub[5]);
            }
            else if(sub[6]=="Ｃ"){
                acc[key]['grade']['C'] += Number(sub[5]);
            }
            else if(sub[6]=="Ｄ"){
                acc[key]['grade']['D'] += Number(sub[5]);
            }
            else if(sub[6]=="Ｅ"){
                acc[key]['grade']['E'] += Number(sub[5]);
            }
        }
        return acc;
    }, {});
    let sortedKeys = Object.keys(preSortedData).sort();
    let sortedData = {};

    sortedKeys.forEach(key => {
        sortedData[key] = preSortedData[key];
    });
    // console.log(sortedData);
    let spcCreditSums = [];
    let spcCreditSumsAll = [];
    let genCreditSums = [];
    let genCreditSumsAll = [];
    let spcGpas = [];
    let genGpas = [];
    let gpa = [];
    let cumulGpa = [];
    let cumulGp = 0;
    let cumulCredit = 0;
    for (let key in sortedData) {
        spcCreditSums.push(sortedData[key]['spcCreditSum']);
        spcCreditSumsAll.push(sortedData[key]['spcCreditSumAll']);
        genCreditSums.push(sortedData[key]['genCreditSum']);
        genCreditSumsAll.push(sortedData[key]['genCreditSumAll']);
        if(sortedData[key]['spcGpSum'] !== 0){
            spcGpas.push((sortedData[key]['spcGpSum'] / sortedData[key]['spcCreditSum']).toFixed(2));
        }
        else{
            spcGpas.push(null);
        }
        if(sortedData[key]['genGpSum'] !== 0){
            genGpas.push((sortedData[key]['genGpSum'] / sortedData[key]['genCreditSum']).toFixed(2));
        }
        else{
            genGpas.push(null);
        }
        if(sortedData[key]['spcGpSum'] !== 0 || sortedData[key]['genGpSum'] !== 0){
            gpa.push(((sortedData[key]['spcGpSum']+sortedData[key]['genGpSum'])/(sortedData[key]['spcCreditSum']+sortedData[key]['genCreditSum'])).toFixed(2));
            cumulCredit += sortedData[key]['spcCreditSum']+sortedData[key]['genCreditSum'];
            cumulGp += sortedData[key]['spcGpSum']+sortedData[key]['genGpSum'];
            cumulGpa.push((cumulGp/cumulCredit).toFixed(2));
        }
        else{
            gpa.push(null);
            cumulGpa.push(null);
        }
    }
    let labels = Object.keys(sortedData);

    let targ = document.querySelector('#funcForm > hr.ui-separator.ui-state-default.ui-corner-all');
    let sibling = targ.nextElementSibling;
    let found = false;
    let container;
    let minicontainer;
    let subcontainer;
    let table;
    let figure;
    let chart;
    while (sibling) {
        if (sibling.tagName.toLowerCase() === 'div' && sibling.getAttribute('data-added-by') === 'me') {
            found = true;
            container = sibling;
            break;
        }
        sibling = sibling.nextElementSibling;
    }
    if(found==false){
        container = document.createElement('div');
        container.id = 'figureContainer';
        container.setAttribute('data-added-by', 'me');
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'auto auto';
        container.style.alignItems = 'flex-start';
        container.style.gap = '5px';
        container.style.width = '100%';
        container.style.boxSizing = 'border-box';
        container.style.margin = '0 auto';
        container.style.padding = '0 10px';
        container.style.border = '1px solid #ccc';
        container.style.borderRadius = '5px';
        container.style.backgroundColor = '#f9f9f9';
        container.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        container.style.position = 'relative';
        container.style.zIndex = '9999';
        container.style.overflow = 'auto';
        container.style.maxWidth = '100%';
        container.style.maxHeight = '100%';
        container.style.overflowY = 'auto';
        container.style.overflowX = 'hidden';
        container.style.fontSize = '14px';
        // container.style.fontFamily = 'Arial, sans-serif';
        container.style.lineHeight = '1.5';
        container.style.color = '#333';
        container.style.height = '55vh';
        minicontainer = document.createElement('div');
        minicontainer.id = 'minicontainer';
        container.appendChild(minicontainer);
        minicontainer.style.width = '40vw';
        minicontainer.style.margin = 'auto';
        minicontainer.style.flex = '1 1 auto';
        minicontainer.style.gridRow = '1';
        targ.after(container);
        subcontainer = document.createElement('div');
        subcontainer.id = 'subcontainer';
        container.appendChild(subcontainer);
        subcontainer.style.width = '40vw';
        subcontainer.style.margin = 'auto';
        subcontainer.style.flex = '1 1 auto';
        subcontainer.style.gridRow = '2';
        subcontainer.style.marginBottom = '10px';
        targ.after(container);
        // table = document.createElement('table');

        let data = [];
        labels.forEach((label, index) => {
            let row = [
                label,
                spcCreditSums[index] + ' / ' + spcCreditSumsAll[index],
                genCreditSums[index] + ' / ' + genCreditSumsAll[index],
                spcGpas[index],
                genGpas[index],
                gpa[index]
            ].map(text => (text !== undefined && text !== null) ? text : '-');
            data.push(row);
        });

        table = new gridjs.Grid({
            columns: ['年度', '専門単位', '全学単位', '専門GPA', '全学GPA', '合計GPA'],
            data: data,
            style: {
                th: {
                    border: '1px solid #ddd',
                    padding: '2px',
                    backgroundColor: '#f2f2f2',
                    textAlign: 'center',
                },
                td: {
                    border: '1px solid #ddd',
                    padding: '2px',
                    textAlign: 'center',
                    height: '4.5vh',
                    width: '3vw',
                    minWidth: '3em',
                },
                table: {
                  'font-size': '15px',
                  marginRight: '3px',
                  maxWidth: '90%',
                }
            }
        }).render(minicontainer);

        let gradeData = [];
        labels.forEach((label, index) => {
            let row = [
                label,
                sortedData[label]['grade']['AA'] || 0,
                sortedData[label]['grade']['A'] || 0,
                sortedData[label]['grade']['B'] || 0,
                sortedData[label]['grade']['C'] || 0,
                sortedData[label]['grade']['D'] || 0,
                sortedData[label]['grade']['E'] || 0
            ];
            gradeData.push(row);
        });

        let totalGrades = { 'AA': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0 };
        labels.forEach(label => {
            totalGrades['AA'] += sortedData[label]['grade']['AA'] || 0;
            totalGrades['A'] += sortedData[label]['grade']['A'] || 0;
            totalGrades['B'] += sortedData[label]['grade']['B'] || 0;
            totalGrades['C'] += sortedData[label]['grade']['C'] || 0;
            totalGrades['D'] += sortedData[label]['grade']['D'] || 0;
            totalGrades['E'] += sortedData[label]['grade']['E'] || 0;
        });
        // 合計行を追加
        gradeData.push([
            '合計',
            totalGrades['AA'],
            totalGrades['A'],
            totalGrades['B'],
            totalGrades['C'],
            totalGrades['D'],
            totalGrades['E']
        ]);

        gradeTable = new gridjs.Grid({
            columns: ['年度', 'AA', 'A', 'B', 'C', 'D', 'E'], // 列名
            data: gradeData,
            style: {
                th: {
                    border: '1px solid #ddd',
                    padding: '2px',
                    backgroundColor: '#f2f2f2',
                    textAlign: 'center',
                },
                td: {
                    border: '1px solid #ddd',
                    padding: '2px',
                    textAlign: 'center',
                    height: '4.5vh',
                    width: '3vw',
                    minWidth: '3em',
                },
                table: {
                    'font-size': '15px',
                    marginRight: '3px',
                    maxWidth: '90%',
                }
            }
        }).render(subcontainer); // 既存の `minicontainer` に追加

        // table.setAttribute('data-added-by', 'me');
        // table.style.width = '40%';
        // table.style.height = '200%';
        // table.style.margin = '10% auto';
        // container.appendChild(table);
        // let thead = document.createElement('thead');
        // let headerRow = document.createElement('tr');
        // ['年度', '専門単位', '全学単位', '専門GPA', '全学GPA', '合計GPA'].forEach(text => {
        //     let th = document.createElement('th');
        //     th.innerText = text;
        //     th.style.border = '1px solid #ddd';
        //     th.style.padding = '6px';
        //     th.style.backgroundColor = '#f2f2f2';
        //     th.style.textAlign = 'center';
        //     headerRow.appendChild(th);
        // });
        // thead.appendChild(headerRow);
        // table.appendChild(thead);

        // let tbody = document.createElement('tbody');
        // labels.forEach((label, index) => {
        //     let row = document.createElement('tr');
        //     [label, spcCreditSums[index]+' / '+spcCreditSumsAll[index], genCreditSums[index]+' / '+genCreditSumsAll[index], spcGpas[index], genGpas[index], gpa[index]].forEach(text => {
        //         let td = document.createElement('td');
        //         td.innerText = (text !== undefined && text !== null) ? text : '-';
        //         td.style.border = '1px solid #ddd';
        //         td.style.padding = '6px';
        //         td.style.textAlign = 'center';
        //         row.appendChild(td);
        //     });
        //     tbody.appendChild(row);
        // });
        // table.appendChild(tbody);

        let gpaScale = [...spcGpas, ...genGpas, ...gpa, ...cumulGpa].filter(gpa => gpa !== null);
        let minGpa = Math.min(...gpaScale);
        let maxGpa = Math.max(...gpaScale);
        figure = document.createElement('canvas');
        figure.setAttribute('data-added-by', 'me');
        figure.style.maxWidth = '50vw';
        figure.style.maxHeight = '50vh';
        figure.style.margin = 'auto';
        figure.style.padding = '0 20px';
        figure.style.flex = '1 1 auto';
        figure.style.gridRow = '1';
        container.appendChild(figure);
        targ.after(container);
        chart = new Chart(figure, {
            type: 'bar',
            plugins: [ChartDataLabels],
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '専門単位',
                        data: spcCreditSums,
                        borderWidth: 1,
                        yAxisID: 'y-axis-0'
                    },
                    {
                        label: '全学単位',
                        data: genCreditSums,
                        borderWidth: 1,
                        yAxisID: 'y-axis-0'
                    },
                    {
                        label: '専門GPA',
                        data: spcGpas,
                        type: 'line',
                        borderWidth: 2,
                        yAxisID: 'y-axis-1'
                    },
                    {
                        label: '全学GPA',
                        data: genGpas,
                        type: 'line',
                        borderWidth: 2,
                        yAxisID: 'y-axis-1'
                    },
                    {
                        label: '合計GPA',
                        data: gpa,
                        type: 'line',
                        borderWidth: 2,
                        yAxisID: 'y-axis-1'
                    },
                    {
                        label: '累積GPA',
                        data: cumulGpa,
                        type: 'line',
                        borderWidth: 2,
                        yAxisID: 'y-axis-1'
                    }
                ]
            },
            options: {
                layout: {
                    padding: {
                        left: 0,
                        right: 25,
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
                    // tooltip: {
                    //     enabled: false
                    // },
                    datalabels: {
                        // display: function(context) {
                        //     return context.dataset.label === '累積GPA' || context.dataset.label === '合計GPA';
                        // },
                        display: false,
                        align: 'top',
                        anchor: 'end',
                        font: {
                            size: 13,
                            color: 'black'
                        },
                        formatter: function( value, context ) {
                            return value !== (null || 0) ? value.toString() : '';
                        }
                    }
                },
                maintainAspectRatio: false,
                // responsive: true,
            }
        });
    }
}
function correctData(){
    let elements = document.querySelectorAll('.ui-datatable.ui-widget.min-width.sskTable.ui-datatable-resizable');
    let data = [];
    let isSingle;
    if(document.getElementById('funcForm:initPtn:0').checked==true){
        isSingle=true;
    }
    else{
        isSingle=false;
    }
    if (elements.length > 0) {
        elements.forEach(element => {
            let rows=element.querySelectorAll('[role="row"');
            // data[0]=["履修中","区分深度2","区分深度3","区分深度4","科目","単位数","評価","GPA対象","年度","学期","教員氏名"];
            let isFirstIteration = true;
            let level2, level3, level4, level5, level6, now, subject, credit, grade, gpaScope, year, term, teacher;
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
                    });
                    isFirstIteration=false;
                }
                else{
                    let subjectName=row.querySelector('[class^="colKmkName"]');
                    if(subjectName.className=="colKmkName alignCenter kamokuLevel2"){
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
                        grade = row.querySelector('[class^="colHyoka"]') ? row.querySelector('[class^="colHyoka"]').textContent : '';
                        gpaScope = row.querySelector('[class^="colGpaTgt"]') ? row.querySelector('[class^="colGpaTgt"]').textContent : '';
                        if(isSingle==true){
                            year = row.querySelector('[class^="colNendo"]') ? row.querySelector('[class^="colNendo"]').textContent : '';
                            term = row.querySelector('[class^="colGakki"]') ? row.querySelector('[class^="colGakki"]').textContent : '';
                        }
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
                        data.push([now,level2,level3,combined,subject,credit,grade,gpaScope,year,term,teacher]);
                    }
                }
            });
        });
    }
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
function downloadcsv(){
    let elements = document.querySelectorAll('.ui-datatable.ui-widget.min-width.sskTable.ui-datatable-resizable');
    let csv, data = [];
    let book=XLSX.utils.book_new();
    let isSingle;
    if(document.getElementById('funcForm:initPtn:0').checked==true){
        isSingle=true;
    }
    else{
        isSingle=false;
    }
    if (elements.length > 0) {
        elements.forEach(element => {
            let rows=element.querySelectorAll('[role="row"');
            // if(isSingle==true){
            //     csv = "分野,系列,科目,履修中,教員氏名,GPA対象,単位,得点,評価,年度,学期\r\n";
            // }
            // else{
                data[0]=["履修中","区分深度2","区分深度3","区分深度4","科目","単位数","評価","GPA対象","年度","学期","教員氏名"];
                // data[0]=["分野","系列","科目","履修中","教員氏名","GPA対象","単位","得点","評価","年度","学期"];
            // }
            let isFirstIteration = true;
            let level2, level3, level4, level5, level6, now, subject, credit, grade, gpaScope, year, term, teacher;
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
                        else{
                            // console.log(header.textContent);
                        }
                    });
                    isFirstIteration=false;
                }
                else{
                    let subjectName=row.querySelector('[class^="colKmkName"]');
                    if(subjectName.className=="colKmkName alignCenter kamokuLevel2"){
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
                        grade = row.querySelector('[class^="colHyoka"]') ? row.querySelector('[class^="colHyoka"]').textContent : '';
                        gpaScope = row.querySelector('[class^="colGpaTgt"]') ? row.querySelector('[class^="colGpaTgt"]').textContent : '';
                        if(isSingle==true){
                            year = row.querySelector('[class^="colNendo"]') ? row.querySelector('[class^="colNendo"]').textContent : '';
                            term = row.querySelector('[class^="colGakki"]') ? row.querySelector('[class^="colGakki"]').textContent : '';
                        }
                        teacher = row.querySelector('[class^="colKyuinName"]') ? row.querySelector('[class^="colKyuinName"]').textContent : '';
                        // if(isSingle==true){
                        //     csv += level2 + "," + level3 + "," + subject + "," + now + "," + teacher + "," + gpaScope + "," + credit + "," + "" +"," + grade + "," + year + "," + term + "\r\n";
                        //     // csv += now + "," + level2 + "," + level3 + "," + level4 + "," + level5 + "," + level6 + "," + credit + "," + grade + "," + gpaScope + "," + year + "," + term + "," + teacher + "\r\n";
                        // }
                        // else{
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
                            data.push([now,level2,level3,combined,subject,credit,grade,gpaScope,year,term,teacher]);
                        // }
                    }
                }
            });
            // if(isSingle==false){
                let sheet=XLSX.utils.aoa_to_sheet(data);
                data=[];
                XLSX.utils.book_append_sheet(book,sheet,year+"年度"+term);
            // }
        });
    }
    let blob;
    let fileName;
    // if(isSingle==true){
    //     let bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    //     blob = new Blob([bom, csv], { type: "text/csv" });
    //     fileName = "credit-new.csv";
    // }
    // else{
        let binary = XLSX.write(book, { type: 'array' });
        blob = new Blob([binary], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        fileName = "credit-new-term.xlsx";
    // }
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
let showGeneral=true;
let showProfessional=true;
function gpaCal(element){
    rows=element.querySelectorAll('[role="row"');
    let gpSum=0;
    let creditSum=0;
    let gpCreditSum=0;
    let acceptedSum=0;
    let isFirstIteration = true;
    let level2, level3, level4, level5, level6;
    rows.forEach(row => {
        if(isFirstIteration==true){
            let isFirst=true;
            headers=row.querySelectorAll('[role="columnheader"]');
            headers.forEach(header => {
                if(isFirst==true){
                    isFirst=false;
                }
                else{
                    // console.log(header.textContent);
                }
            });
            isFirstIteration=false;
        }
        else{
            row.style.display="";
            let subjectName=row.querySelector('[class^="colKmkName"]');
            if(subjectName.className=="colKmkName alignCenter kamokuLevel2"){
                level2=subjectName.textContent;
                level3="";
                level4="";
                level5="";
                level6="";
                if((showGeneral==false&&level2=="全学教育科目")||(showProfessional==false&&level2=="専門教育科目")){
                    row.style.display="none";
                }
            }
            else if(subjectName.className=="colKmkName alignCenter kamokuLevel3"){
                level3=subjectName.textContent;
                level4="";
                level5="";
                level6="";
                if((showGeneral==false&&level2=="全学教育科目")||(showProfessional==false&&level2=="専門教育科目")){
                    row.style.display="none";
                }
            }
            else if(subjectName.className=="colKmkName alignCenter kamokuLevel4"){
                level4=subjectName.textContent;
                level5="";
                level6="";
                if((showGeneral==false&&level2=="全学教育科目")||(showProfessional==false&&level2=="専門教育科目")){
                    row.style.display="none";
                }
            }
            else if(subjectName.className=="colKmkName alignCenter kamokuLevel5"){
                level5=subjectName.textContent;
                level6="";
                if((showGeneral==false&&level2=="全学教育科目")||(showProfessional==false&&level2=="専門教育科目")){
                    row.style.display="none";
                }
            }
            else if(subjectName.className=="colKmkName alignCenter kamokuLevel6"){
                level6=subjectName.textContent;
                if((showGeneral==false&&level2=="全学教育科目")||(showProfessional==false&&level2=="専門教育科目")){
                    row.style.display="none";
                }
            }
            else{
                if((showGeneral==false&&level2=="全学教育科目")||(showProfessional==false&&level2=="専門教育科目")){
                    row.style.display="none";
                    return;
                }
                let gpaTgt=row.querySelector('[class^="colGpaTgt"]');
                let tani=row.querySelector('[class^="colTani"]');
                let credit=Number(tani.textContent);
                let hyoka=row.querySelector('[class^="colHyoka"]');
                if(gpaTgt){
                    if(gpaTgt.textContent!="○"){
                        creditSum+=credit;
                        if(hyoka && hyoka.textContent!=""){
                            acceptedSum+=credit;
                        }
                        return;
                    }
                }
                if(hyoka){
                    let gp=convGrade(hyoka.textContent);
                    if(gp==undefined){
                        creditSum+=credit;
                    }
                    else{
                        gpSum+=gp*credit;
                        creditSum+=credit;
                        gpCreditSum+=credit;
                        acceptedSum+=credit;
                    }
                }
                else{
                    creditSum+=credit;
                }
            }
        }
    });
    let gpa=gpSum/gpCreditSum;
    if(gpSum==0){
        gpa = "-";
    }
    else{
        gpa = Math.round(gpa*100)/100;
    }
    // console.log(gpSum,creditSum,gpCreditSum,acceptedSum,gpa);
    return [creditSum.toFixed(1),gpCreditSum.toFixed(1),acceptedSum.toFixed(1),gpa];
};
function convGrade(char){
    if(char==""){
        return undefined;
    }
    else if(char=="ＡＡ"){
        return 4.0;
    }
    else if(char=="Ａ"){
        return 3.0;
    }
    else if(char=="Ｂ"){
        return 2.0;
    }
    else if(char=="Ｃ"){
        return 1.0;
    }
    else{
        return 0.0;
    }
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

function addCheckbox() {
    let container = document.createElement('div');
    container.id = 'fullWidthContainer';
    container.style.width = '100%';
    container.style.boxSizing = 'border-box';

    let targetNode = document.querySelector('#funcForm\\:j_idt187');
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

    const checkbox1 = createCheckbox(
        'funcForm:prolDispFlg',
        '専門教育科目',
        'ControlID-8',
        true,
        (checked) => {
            showProfessional = checked;
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

    const checkbox2 = createCheckbox(
        'funcForm:genDispFlg',
        '全学教育科目',
        'ControlID-9',
        true,
        (checked) => {
            showGeneral = checked;
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

    const descriptionText = document.createElement('div');
    descriptionText.id = 'descriptionText';
    descriptionText.textContent = '表示切替';
    descriptionText.className = 'description-text';

    container.appendChild(descriptionText);
    container.appendChild(checkbox1);
    container.appendChild(checkbox2);

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
