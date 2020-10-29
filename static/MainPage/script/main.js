let dataDisksFree = []; //data of disks
let dataDisksTotal = []; //data of disks
let dataDisksOccupied = []; //data of disks

let dataMemoryWired = []; //data of memory
let dataMemoryFree = []; //data of memory
let dataMemoryTotal = []; //data of memory

let dataSystemCpu = []; //data of System cpu
let dataUserCpu = []; //data of User cpu

let agents = []; //array of agent`s public key
let checkedRadio; //value of checked radiobutton (which agent is selected)
let currentSelectedDataToCheck; //то что находится в head в селекте; 

let labelsTime = []; //server`s updated time (only hours, minutes and seconds);

let dataSystem = []; //data of cpu
let dataUser = []; //data of cpu

let keysOfData; //название ключей объекта data

let keyCpu; //ключ cpu
let keyMemory; //ключ memory
let keyDisk; //ключ disk

let nonRepeatingCanvasPK; //неповторяющиеся элементы у массива canvasIdOnlyPublicKeysOfServers
let nonRepeatingDataToCheck; //неповторяющиеся элементы у массива dataToCheck

let fontSizeOfLabels; //размер шрифта для лейблов

$(document).ready(function () {

    $('#home').on('click', function () {
        $(location).attr('href', '/');
    });

    $('#settings').on('click', function () {
        $(location).attr('href', '/settings');
    });

    select();

    //    checking authorized user or not
    $.get(
        "api/isAuth", {},
        function (data) {
            data = JSON.parse(data);

            let userName;

            if (data.auth == "true") {
                console.log("Auth is true");
                $('#userName').text(data.mail);
                $('html').css('display', 'block');
                userName = data.mail.split('@');
                $('#userName').text(userName[0]);
            }
            if (data.auth == "false") {
                $(location).attr('href', '/login');
            }
        }
    );

    $(".quit").on('click', function () {
        $(location).attr('href', '/logout');
    });

    //getting agents
    console.log("Getting agents");

    $.get(
        "/api/getAgentList", {},
        function (data) {
            data = JSON.parse(data);

            let public_key;
            for (var key in data['agents']) {
                console.log(data.agents[key].public_key);

                public_key = data.agents[key].public_key;

                $('.listOfServers').append(
                    $('<li>').append(
                        $('<input>').attr({
                            type: 'radio',
                            name: 'servers',
                            id: public_key,
                            value: public_key
                        })
                    ).append(
                        $('<label>').attr({
                            for: public_key
                        }).text(public_key)
                    )
                );

                //generating canvases to each chart
                //checking if the canvas is created with a specific id
                if ($(`#${public_key}_CPU`).length == false || $(`#${public_key}_Memory`).length == false || $(`#${public_key}_Disks`).length == false) {
                    $('.chart').append(`<canvas id="${public_key}_CPU"></canvas>`);
                    $('.chart').append(`<canvas id="${public_key}_Memory"></canvas>`);
                    $('.chart').append(`<canvas id="${public_key}_Disk"></canvas>`);

                    $(`#${public_key}_CPU`).css('display', 'none');
                    $(`#${public_key}_Memory`).css('display', 'none');
                    $(`#${public_key}_Disk`).css('display', 'none');
                }

                //pushing name of agents in array
                agents.push(public_key);
            }


            //при изменении радиобатонов серверов

            let children = $(".chart").children(); //получаем все канвасы
            let idOfCanvas = []; //массив где хранятся ид канвасов не разделенные сплитом

            children.each(function (index) {
                idOfCanvas.push($(children[index]).attr('id'));
            });

            //                console.log('id of canvases down');
            //                console.log(idOfCanvas);

            let splited = []; //двумерный массив из разделенных идшников канвасов, где [0] - паблик кей сервера, [1] - данные что будут отображаться (cpu/memory/disks)
            idOfCanvas.forEach(function (item, index, array) {
                splited[index] = item.split('_');
            });

            //                console.log('splited down');
            //                console.log(splited);

            let canvasIdOnlyPublicKeysOfServers = []; //ид канвасов, только разделенные сплитом, т.е. хранятся паблик кеи серверов (могут повторятся)
            for (var i = 0; i < splited.length; i++) {
                canvasIdOnlyPublicKeysOfServers.push(splited[i][0]);
            }

            //                console.log('canvasIdOnlyPublicKeysOfServers down');
            //                console.log(canvasIdOnlyPublicKeysOfServers);

            let dataToCheck = []; //массив для хранения данных которые будут отображаться на графике (ид канваса разделено split (cpu/memory/disks)) (могут повторятся)
            for (var i = 0; i < splited.length; i++) { //добавляем в массив что чекать будем
                dataToCheck.push(splited[i][1]);
            }
            //                console.log('data to check down');
            //                console.log(dataToCheck);

            nonRepeatingCanvasPK = canvasIdOnlyPublicKeysOfServers.filter(function (elem, pos) { //убираем повторяющиеся элементы у массива canvasIdOnlyPublicKeysOfServers
                return canvasIdOnlyPublicKeysOfServers.indexOf(elem) == pos;
            });

            //                console.log('nonRepeatingCanvasPK down');
            //                console.log(nonRepeatingCanvasPK);

            nonRepeatingDataToCheck = dataToCheck.filter(function (elem, pos) { //убираем повторяющиеся элементы у массива dataToCheck
                return dataToCheck.indexOf(elem) == pos;
            });

            //                console.log('nonRepeatingDataToCheck down');
            //                console.log(nonRepeatingDataToCheck);

            //getting info from agent
            let servers;
            let interval;

            servers = $('input[name=servers]');

            servers.on('change', function () {
                labelsTime = [];
                dataSystem = [];
                dataUser = [];
                dataMemoryWired = [];
                dataMemoryFree = [];
                dataDisksFree = [];
                dataDisksTotal = [];
                dataDisksOccupied = [];

                $(`#${checkedRadio}_${currentSelectedDataToCheck}`).css('display', 'none'); //скрываем ту диаграмму которая не выбран


                checkedRadio = $(this).val();
                //                console.log(checkedRadio);
                agents.forEach(function (item, index, array) {

                    if (checkedRadio == item) {
                        clearInterval(interval);
                        getInfoJSONFromAgent(checkedRadio);
                        interval = setInterval(getInfoJSONFromAgent, 65000, checkedRadio);
                    }
                });

                prepareDataToShow();

            });
        }
    );

    $('#itemCpu').on('click', function () {
        if ($('.chart').children().css('display') == 'block') {
            $('.chart').children().css('display', 'none');
        }
        prepareDataToShow();
    });

    $('#itemMemory').on('click', function () {
        if ($('.chart').children().css('display') == 'block') {
            $('.chart').children().css('display', 'none');
        }
        prepareDataToShow();
    });

    $('#itemDisk').on('click', function () {
        if ($('.chart').children().css('display') == 'block') {
            $('.chart').children().css('display', 'none');
        }
        prepareDataToShow();
    });

    //    setInterval(function () {
    //
    //        if ($(window).width() > 576 && $(window).width() < 991.98) {
    //            fontSizeOfLabels = 3 * $(window).width() / 100;
    //        }
    //        if ($(window).width() > 992 && $(window).width() < 1030.98) {
    //            fontSizeOfLabels = 1.5 * $(window).width() / 100;
    //        } else {
    //            fontSizeOfLabels = 1 * $(window).width() / 100;
    //        }
    //
    //    }, 100);

});

function prepareDataToShow() {
    currentSelectedDataToCheck = $('.select__current').text();

    let ctx; // ид канваса куда рисовать график
    let chartName; // ид канваса куда рисовать график
    let labelDataset_1;
    let labelDataset_2;
    let dataToShow_1 = []; //данные для графика
    let dataToShow_2 = []; //данные для графика
    let backColor_1;
    let backColor_2;
    let border_1;
    let border_2;

    for (let i = 0; i < nonRepeatingCanvasPK.length; i++) {
        for (let j = 0; j < nonRepeatingDataToCheck.length; j++) {
            if (currentSelectedDataToCheck.toLowerCase() == nonRepeatingDataToCheck[j].toLowerCase() && checkedRadio.toLowerCase() == nonRepeatingCanvasPK[i].toLowerCase()) {

                $(`#${checkedRadio}_${currentSelectedDataToCheck}`).remove(); //эта херня нужна чтобы старые данные не накладывались на новые. Потому что при наведении можно было видеть старые данные
                $('.chart').append(`<canvas id="${checkedRadio}_${currentSelectedDataToCheck}"></canvas>`); //я хз почему оно так ибо массивы значений я обнуляю. Сlear и destroy не помогают >:(


                $(`#${checkedRadio}_${currentSelectedDataToCheck}`).css('display', 'block'); //показываем график

                ctx = $(`#${checkedRadio}_${currentSelectedDataToCheck}`);
                chartName = $(`#${checkedRadio}_${currentSelectedDataToCheck}`);

                if (currentSelectedDataToCheck.toLocaleLowerCase() == 'cpu') {
                    labelDataset_1 = 'System';
                    labelDataset_2 = 'User';
                    dataToShow_1 = dataSystem;
                    dataToShow_2 = dataUser;
                    backColor_1 = 'rgba(255, 81, 95, 0.5)';
                    backColor_2 = 'rgba(103, 164, 255, 0.5)';
                    border_1 = '#FF941A';
                    border_2 = '#7F5CFF';
                }
                if (currentSelectedDataToCheck.toLocaleLowerCase() == 'memory') {
                    labelDataset_1 = 'Wired';
                    labelDataset_2 = 'Free';
                    dataToShow_1 = dataMemoryWired;
                    dataToShow_2 = dataMemoryFree;
                    backColor_1 = 'rgba(90, 255, 81, 0.5)';
                    backColor_2 = 'rgba(255, 252, 74, 0.5)';
                    border_1 = '#3FFFC9';
                    border_2 = '#FF7C6B';
                }
                if (currentSelectedDataToCheck.toLocaleLowerCase() == 'disk') {
                    labelDataset_1 = 'Free';
                    labelDataset_2 = 'Occupied';
                    dataToShow_1 = dataDisksFree;
                    dataToShow_2 = dataDisksOccupied;
                    backColor_1 = 'rgba(150, 89, 255, 0.5)';
                    backColor_2 = 'rgba(81, 255, 243, 0.5)';
                    border_1 = '#E921FF';
                    border_2 = '#4A83FF';
                }

                drawChart(chartName, ctx, labelsTime, labelDataset_1, labelDataset_2, dataToShow_1, dataToShow_2, backColor_1, backColor_2, border_1, border_2);
            }
        }
    }
}

function drawChart(chartName, ctx, labelsTime, labelDataset_1, labelDataset_2, dataToShow_1, dataToShow_2, backColor_1, backColor_2, border_1, border_2) {

    Chart.defaults.global.defaultFontFamily = 'circe';
    //    Chart.defaults.global.defaultFontSize = fontSizeOfLabels;

    console.log($(window).width());
    let data = {
        labels: [],
        datasets: [
            {
                label: [],
                data: [],
                backgroundColor: backColor_1,
                borderColor: border_1
            },
            {
                label: [],
                data: [],
                backgroundColor: backColor_2,
                borderColor: border_2
            }
        ]
    };

    let options = {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
            display: true,
            position: 'bottom'
        }
    }

    chartName = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options,

    });



    chartName.data.labels = labelsTime;
    chartName.data.datasets[0].label = labelDataset_1;
    chartName.data.datasets[0].data = dataToShow_1;

    chartName.data.datasets[1].label = labelDataset_2;
    chartName.data.datasets[1].data = dataToShow_2;

    chartName.clear();
    chartName.update();


}

function findCheckedRadio() {
    $("input:radio:checked").each(function () {
        checkedRadio = $(this).val();
    });
}


function getInfoJSONFromAgent(nameOfServer) {
    labelsTime = [];
    dataSystem = [];
    dataUser = [];
    dataMemoryWired = [];
    dataMemoryFree = [];
    dataDisksTotal = [];
    dataDisksOccupied = [];

    console.log("Getting from " + nameOfServer);

    $.get(
        "/api/getAgentData", {
            "public_key": nameOfServer,
            "count": 5
        },
        function (data) {
            data = JSON.parse(data);
            //            console.log(data);
            keysOfData = Object.keys(data.dataset[0].data);
            //            console.log(keysOfData);
            keyCpu = keysOfData[3];
            keyMemory = keysOfData[0];
            keyDisk = keysOfData[2];


            if (data['dataset'].length == 0) {
                $('.wired').text('no data');
                $('.total').text('no data');
                $('.inactive').text('no data');
                $('.active').text('no data');
                $('.free').text('no data');

                $('.system').text('no data');
                $('.idle').text('no data');
                $('.num').text('no data');
                $('.user').text('no data');

                $('.1min').text('no data');
                $('.5min').text('no data');
                $('.15min').text('no data');

                $('.diskTotal').text('no data');
                $('.barWrapper').css('display', 'none');
                $('.load').css('marginBottom', '0.5em');

                $('.positioning').css('opacity', '0');



            } else {
                $('.barWrapper').css('display', 'block');
                $('.load').css('marginBottom', '0');
                $('.positioning').css('opacity', '1');

                let serverTime = []; //server`s updating time
                for (var key in data['dataset']) {

                    $('.wired').text((data.dataset[0].data.memory.wired / 1000000).toFixed(2) + ' Mb');
                    $('.total').text((data.dataset[0].data.memory.total / 1000000).toFixed(2) + ' Mb');
                    $('.inactive').text(data.dataset[0].data.memory.inactive);
                    $('.active').text(data.dataset[0].data.memory.active);
                    $('.free').text((data.dataset[0].data.memory.free / 1000000).toFixed(2) + ' Mb');

                    $('.system').text(data.dataset[0].data.cpu[0].system + '%');
                    $('.idle').text(data.dataset[0].data.cpu[0].idle + '%');
                    $('.user').text(data.dataset[0].data.cpu[0].user + '%');

                    $('.1min').text(data.dataset[0].data.load[0]);
                    $('.5min').text(data.dataset[0].data.load[1]);
                    $('.15min').text(data.dataset[0].data.load[2]);

                    $('.diskFree').text((data.dataset[0].data.disks[0].free / 1000000).toFixed(0) + '/');
                    $('.diskTotal').text((data.dataset[0].data.disks[0].total / 1000000).toFixed(0) + ' Mb');
                    $('.nameDisk').text(data.dataset[0].data.disks[0].origin);

                    $('.nameNetwork1').text(data.dataset[0].data.network[0].name);
                    $('.downloadSpeed1').text((data.dataset[0].data.network[0].in / 1000000).toFixed(1) + 'Mb/s');
                    $('.uploadSpeed1').text((data.dataset[0].data.network[0].out / 1000000).toFixed(1) + 'Mb/s');

                    $('.nameNetwork2').text(data.dataset[0].data.network[1].name);
                    $('.downloadSpeed2').text((data.dataset[0].data.network[1].in / 1000000).toFixed(1) + 'Mb/s');
                    $('.uploadSpeed2').text((data.dataset[0].data.network[1].out / 1000000).toFixed(1) + 'Mb/s');

                    serverTime.push(data.dataset[key].scan_time.split(' '));
                    //                    console.log(serverTime[key][1]);
                    labelsTime.push(serverTime[key][1]);

                    dataSystem.push(data.dataset[key].data.cpu[0].system);
                    dataUser.push(data.dataset[key].data.cpu[0].user);

                    dataDisksOccupied.push(((data.dataset[key].data.disks[0].total - data.dataset[key].data.disks[0].free) / 1000000).toFixed(3));
                    dataDisksFree.push((data.dataset[key].data.disks[0].free / 1000000).toFixed(2));
                    dataDisksTotal.push((data.dataset[key].data.disks[0].total / 1000000).toFixed(2));

                    dataMemoryWired.push((data.dataset[key].data.memory.wired / 1000000).toFixed(2));
                    dataMemoryFree.push((data.dataset[key].data.memory.free / 1000000).toFixed(2));
                    dataMemoryTotal.push((data.dataset[key].data.memory.total / 1000000).toFixed(2));
                }


                labelsTime.reverse();

                dataSystem.reverse();
                dataUser.reverse();

                dataDisksFree.reverse();
                dataDisksTotal.reverse();
                dataDisksOccupied.reverse();

                console.log(dataDisksOccupied);

                dataMemoryWired.reverse();
                dataMemoryFree.reverse();
                dataMemoryTotal.reverse();

                prepareDataToShow();
            }
        });

    return 0;
}

//create select element
let select = function () {
    let selectHeader = document.querySelectorAll('.select__header');
    let selectItem = document.querySelectorAll('.select__item');

    selectHeader.forEach(item => {
        item.addEventListener('click', selectToggle);
    });

    selectItem.forEach(item => {
        item.addEventListener('click', selectChoose);
    });

    function selectToggle() {
        this.parentElement.classList.toggle('is-active');
    }

    function selectChoose() {
        let text = this.innerText;
        let select = this.closest('.select')
        let currentText = select.querySelector('.select__current');
        currentText.innerText = text;
        select.classList.remove('is-active');
    }
};
