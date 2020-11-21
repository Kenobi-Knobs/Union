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

let checkedRadioNetwork; //какой радио выбран из networks

let labelsTime = []; //server`s updated time (only hours, minutes and seconds);

let dataSystem = []; //data of cpu
let dataUser = []; //data of cpu

let dataNetworkDownload = []; //массив данных для отображения download
let dataNetworkUpload = []; //массив данных для отображения upload

let keysOfData; //название ключей объекта data

let keyCpu; //ключ cpu
let keyMemory; //ключ memory
let keyDisk; //ключ disk

let nonRepeatingCanvasPK; //неповторяющиеся элементы у массива canvasIdOnlyPublicKeysOfServers
let nonRepeatingDataToCheck; //неповторяющиеся элементы у массива dataToCheck

let fontSizeOfLabels; //размер шрифта для лейблов

let isCheckedRadio = false; //выбран ли сервер
let isCheckedNetwork = false; //выбран ли network

let startInterval; //значение левого ползунка
let endInterval; //значение правого ползунка

let currentDate; //текущая дата юникс формат
let currentMonth; //текущий месяц
let currentDay; //текущий день
let currentHours; //текущий час
let currentMinutes; //текущая минута

let agoDate; //дата 3 дня назад
let agoMonth; //месяц 3 дня назад
let agoDay; //день 3 дня назад
let agoHours; //час 3 дня назад
let agoMinutes; //минута 3 дня назад

let interval; //интервал через который будут обновляться данные

let canvasesNetworkId = []; //массив для хранения идшников графиков network

let sumOfDownload = 0; //сумма download
let sumOfUpload = 0; //сумма upload

let sumOfDownload1 = 0; //сумма download
let sumOfUpload1 = 0; //сумма upload

$(document).ready(function () {


    $('#home').on('click', function () {
        $(location).attr('href', '/');
    });

    $('#settings').on('click', function () {
        $(location).attr('href', '/settings');
    });

    $('#statistic').on('click', function () {
        $(location).attr('href', '/statistic');
    });

    select();

    //    checking authorized user or not
    $.get(
        "api/isAuth", {},
        function (data) {
            data = JSON.parse(data);

            let userName;

            if (data.auth == "true") {
                //                console.log("Auth is true");
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
    //    console.log("Getting agents");


    $.get(
        "/api/getAgentList", {},
        function (data) {
            data = JSON.parse(data);

            if (data['agents'].length == 0) {
                $('.servers').css('display', 'none');
                $('.alert').css('display', 'block');
                $('.alertText').text('There is nothing to show. Please go to settings to add your first server');
            } else {

                isChecked();
                if (isCheckedRadio == false) {
                    $('.alertText').text('Please choose the server');
                }

                let public_key;
                let host;
                for (var key in data['agents']) {
                    console.log(data);

                    public_key = data.agents[key].public_key;
                    host = data.agents[key].host;

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
                            }).append(
                                $('<span>').text(public_key),
                                $('<span>').attr({
                                    class: 'host'
                                }).text(host)
                            )
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

                //получаем промежуток за которые есть данные
                $.get(
                    "/api/getDataTimeInterval", {
                        public_key: agents[0]
                    },
                    function (data) {
                        data = JSON.parse(data);
                        //                        console.log(data);

                        //создаем слайдер
                        currentDate = new Date(data.max * 1000);
                        currentMonth = currentDate.getMonth() + 1;
                        currentDay = currentDate.getDate();
                        currentHours = currentDate.getHours();
                        currentMinutes = currentDate.getMinutes();

                        agoDate = new Date(data.max * 1000 - 259200000);
                        agoMonth = agoDate.getMonth() + 1;
                        agoDay = agoDate.getDate();
                        agoHours = agoDate.getHours();
                        agoMinutes = agoDate.getMinutes();

                        $(function () {
                            $("#slider-range").slider({
                                range: true,
                                min: agoDate.getTime(),
                                max: currentDate.getTime(),
                                values: [agoDate.getTime(), currentDate.getTime()],
                                step: 3600000,
                                slide: function (event, ui) {
                                    $("#amount").val(new Date(ui.values[0]).getDate() + '.' + (new Date(ui.values[0]).getMonth() + 1) + ' ' + new Date(ui.values[0]).getHours() + ':' + '00' + ' - ' + new Date(ui.values[1]).getDate() + '.' + (new Date(ui.values[1]).getMonth() + 1) + ' ' + new Date(ui.values[1]).getHours() + ':' + '00');
                                    startInterval = Math.round(ui.values[0] / 1000);
                                    endInterval = Math.round(ui.values[1] / 1000);
                                }
                            });
                            $("#amount").val(new Date($("#slider-range").slider("values", 0)).getDate() + '.' + new Date($("#slider-range").slider("values", 0)).getMonth() + ' ' + new Date($("#slider-range").slider("values", 0)).getHours() + ':' + '00' + ' - ' + new Date($("#slider-range").slider("values", 1)).getDate() + '.' + new Date($("#slider-range").slider("values", 1)).getMonth() + ' ' + new Date($("#slider-range").slider("values", 1)).getHours() + ':' + '00');
                            startInterval = Math.round($("#slider-range").slider("values", 0) / 1000);
                            endInterval = Math.round($("#slider-range").slider("values", 1) / 1000);
                        });




                        //                                    currentDate = new Date(data.max * 1000);
                        //                                    agoDate = new Date((data.max - 259200) * 1000);
                        //
                        //                                    $("#slider-range").slider("option", "max", 50);
                        //                                    $("#slider-range").slider("option", "min", 10);
                        //                                    $('#amount').text($("#slider-range").slider("option", "max"));
                        //
                        //                                    console.log(currentDate + ' current');
                        //                                    console.log(agoDate + ' ago');

                    });


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

                servers = $('input[name=servers]');

                servers.on('change', function () {

                    $('#slider-range').slider('destroy');

                    $(".listOfNetworks").empty(); //при выборе другого сервера очищаем networks предыдущего 

                    $('.listOfServers').css('opacity', '0.1');
                    servers.prop('disabled', 'true');

                    //небольшая задержка перед выбором другого сервера
                    setTimeout(function () {
                        $('.listOfServers').css('opacity', '1');
                        servers.removeAttr('disabled');
                    }, 800);

                    isChecked();
                    $('.alert').css('display', 'none');

                    for (let i = 0; i < canvasesNetworkId.length; i++) {
                        $(`#${canvasesNetworkId[i]}`).css('display', 'none'); //скрываем все графики сети при переключении серверов
                    }

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

                            //получаем промежуток за которые есть данные
                            $.get(
                                "/api/getDataTimeInterval", {
                                    public_key: item
                                },
                                function (data) {
                                    data = JSON.parse(data);
                                    //                                    console.log(data);

                                    //создаем слайдер
                                    currentDate = new Date(data.max * 1000);
                                    currentMonth = currentDate.getMonth() + 1;
                                    currentDay = currentDate.getDate();
                                    currentHours = currentDate.getHours();
                                    currentMinutes = currentDate.getMinutes();

                                    agoDate = new Date(data.max * 1000 - 259200000);
                                    agoMonth = agoDate.getMonth() + 1;
                                    agoDay = agoDate.getDate();
                                    agoHours = agoDate.getHours();
                                    agoMinutes = agoDate.getMinutes();

                                    $(function () {
                                        $("#slider-range").slider({
                                            range: true,
                                            min: agoDate.getTime(),
                                            max: currentDate.getTime(),
                                            values: [agoDate.getTime(), currentDate.getTime()],
                                            step: 3600000,
                                            slide: function (event, ui) {
                                                $("#amount").val(new Date(ui.values[0]).getDate() + '.' + (new Date(ui.values[0]).getMonth() + 1) + ' ' + new Date(ui.values[0]).getHours() + ':' + '00' + ' - ' + new Date(ui.values[1]).getDate() + '.' + (new Date(ui.values[1]).getMonth() + 1) + ' ' + new Date(ui.values[1]).getHours() + ':' + '00');
                                                startInterval = Math.round(ui.values[0] / 1000);
                                                endInterval = Math.round(ui.values[1] / 1000);
                                            },
                                            stop: function (event, ui) {
                                                getInfoJSONFromAgent(item);
                                            }
                                        });
                                        $("#amount").val(new Date($("#slider-range").slider("values", 0)).getDate() + '.' + new Date($("#slider-range").slider("values", 0)).getMonth() + ' ' + new Date($("#slider-range").slider("values", 0)).getHours() + ':' + '00' + ' - ' + new Date($("#slider-range").slider("values", 1)).getDate() + '.' + new Date($("#slider-range").slider("values", 1)).getMonth() + ' ' + new Date($("#slider-range").slider("values", 1)).getHours() + ':' + '00');
                                        startInterval = Math.round($("#slider-range").slider("values", 0) / 1000);
                                        endInterval = Math.round($("#slider-range").slider("values", 1) / 1000);
                                    });

                                });

                            clearInterval(interval);
                            getInfoJSONFromAgent(checkedRadio);
                            interval = setInterval(getInfoJSONFromAgent, 65000, checkedRadio);
                        }
                    });

                    prepareDataToShow();

                });
            }
        });

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

function prepareDataToShowNetwork() {

    $(`#canvas_${checkedRadioNetwork}`).remove(); //эта херня нужна чтобы старые данные не накладывались на новые. Потому что при наведении можно было видеть старые данные
    $('.chartNetwork').append(`<canvas id="canvas_${checkedRadioNetwork}"></canvas>`); //я хз почему оно так ибо массивы значений я обнуляю. Сlear и destroy не помогают >:(

    let ctxNetwork; // ид канваса куда рисовать график
    let chartNameNetwork; // ид канваса куда рисовать график
    let labelDataset_1Network;
    let labelDataset_2Network;
    let dataToShow_1Network = []; //данные для графика
    let dataToShow_2Network = []; //данные для графика
    let backColor_1Network;
    let backColor_2Network;
    let border_1Network;
    let border_2Network;


    //    console.log(checkedRadioNetwork);

    //готовим графики для network
    ctxNetwork = $(`#canvas_${checkedRadioNetwork}`);
    chartNameNetwork = $(`#canvas_${checkedRadioNetwork}`);
    labelDataset_1Network = 'Download';
    labelDataset_2Network = 'Upload';
    dataToShow_1Network = dataNetworkDownload;
    dataToShow_2Network = dataNetworkUpload;
    backColor_1Network = 'rgba(255, 81, 95, 0.5)';
    backColor_2Network = 'rgba(103, 164, 255, 0.5)';
    border_1Network = '#FF941A';
    border_2Network = '#7F5CFF';

    drawChartNetwork(chartNameNetwork, ctxNetwork, labelsTime, labelDataset_1Network, labelDataset_2Network, dataToShow_1Network, dataToShow_2Network, backColor_1Network, backColor_2Network, border_1Network, border_2Network);

}


function drawChartNetwork(chartName, ctx, labelsTime, labelDataset_1, labelDataset_2, dataToShow_1, dataToShow_2, backColor_1, backColor_2, border_1, border_2) {
    //    Chart.defaults.global.defaultFontFamily = 'circe';

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

    //готовим данные для всех графиков кроме network
    for (let i = 0; i < nonRepeatingCanvasPK.length; i++) {
        for (let j = 0; j < nonRepeatingDataToCheck.length; j++) {
            if (currentSelectedDataToCheck.toLowerCase() == nonRepeatingDataToCheck[j].toLowerCase() && checkedRadio.toLowerCase() == nonRepeatingCanvasPK[i].toLowerCase()) {

                $(`#${checkedRadio}_${currentSelectedDataToCheck}`).remove(); //эта херня нужна чтобы старые данные не накладывались на новые. Потому что при наведении можно было видеть старые данные
                $('.chart').append(`<canvas id="${checkedRadio}_${currentSelectedDataToCheck}"></canvas>`); //я хз почему оно так ибо массивы значений я обнуляю. Сlear и destroy не помогают >:(


                $(`#${checkedRadio}_${currentSelectedDataToCheck}`).css('display', 'block'); //показываем график

                ctx = $(`#${checkedRadio}_${currentSelectedDataToCheck}`);
                //                console.log(`#${checkedRadio}_${currentSelectedDataToCheck}`);
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

    //    console.log($(window).width());
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

function isChecked() {
    $("input[name='servers']").each(function () {
        isCheckedRadio = $(this).val();
    });
}

function isCheckedRadioNetwork() {
    $("input[name='networks']").each(function () {
        isCheckedNetwork = $(this).val();
        console.log(isCheckedNetwork);
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

    dataNetworkDownload = [];
    dataNetworkUpload = [];

    $.get(
        "/api/getAgentDataByInterval", {
            public_key: nameOfServer,
            start: startInterval,
            end: endInterval
        },
        function (data) {
            data = JSON.parse(data);
            console.log(data);

            if (data['dataset'].length == 0) {
                $('.realtime').css('opacity', '0');
                $('.alert').css('display', 'block');
                $('.alertText').text('There is no data on this server :c');

                $('.diagram').css('display', 'none');
                $('.infoCard').css('display', 'none');
                $('.network').css('display', 'none');

            } else {
                keysOfData = Object.keys(data.dataset[0].data);
                keyCpu = keysOfData[3];
                keyMemory = keysOfData[0];
                keyDisk = keysOfData[2];

                $('.alert').css('display', 'none');
                $('.realtime').css('opacity', '1');
                $('.diagram').css('display', 'block');
                $('.infoCard').css('display', 'flex');
                $('.network').css('display', 'block');

                $('.barWrapper').css('display', 'block');
                $('.load').css('marginBottom', '0');
                $('.positioningNetwork').css('opacity', '1');

                let serverTime = []; //server`s updating time

                let sumOfDataSystem = 0; //сумма значений для System
                let sumOfDataUser = 0; //сумма значений для User
                let sumOfDataIdle = 0; //сумма значений для Idle

                let sumOfDataMemoryWired = 0; //сумма значений для System
                let sumOfDataMemoryFree = 0; //сумма значений для User
                let sumOfDataMemoryTotal = 0; //сумма значений для Idle

                let countAllData = 0; //количество записей

                let networksData = [];

                for (var key in data['dataset']) {

                    sumOfDataSystem += data.dataset[key].data.cpu[0].system;
                    sumOfDataIdle += data.dataset[key].data.cpu[0].idle;
                    sumOfDataUser += data.dataset[key].data.cpu[0].user;

                    sumOfDataMemoryWired += data.dataset[key].data.memory.wired;
                    sumOfDataMemoryFree += data.dataset[key].data.memory.free;
                    sumOfDataMemoryTotal += data.dataset[key].data.memory.total;

                    countAllData++;

                    serverTime.push(data.dataset[key].scan_time.split(' '));

                    labelsTime.push(serverTime[key][1] + ' ' + serverTime[key][0]);

                    dataSystem.push(data.dataset[key].data.cpu[0].system);
                    dataUser.push(data.dataset[key].data.cpu[0].user);

                    dataDisksOccupied.push(((data.dataset[key].data.disks[0].total - data.dataset[key].data.disks[0].free) / 1000000).toFixed(3));
                    dataDisksFree.push((data.dataset[key].data.disks[0].free / 1000000).toFixed(2));


                    dataMemoryWired.push((data.dataset[key].data.memory.wired / 1000000).toFixed(2));
                    dataMemoryFree.push((data.dataset[key].data.memory.free / 1000000).toFixed(2));

                    networksData.push(data.dataset[key].data.network);

                }


                console.log(networksData);

                //                console.log((sumOfDataSystem / countAllData).toFixed(2));
                $('.system').text((sumOfDataSystem / countAllData).toFixed(2) + '%');
                $('.idle').text((sumOfDataIdle / countAllData).toFixed(2) + '%');
                $('.user').text((sumOfDataUser / countAllData).toFixed(2) + '%');

                $('.wired').text((sumOfDataMemoryWired / countAllData / 1000000).toFixed(2) + ' Mb');
                $('.free').text((sumOfDataMemoryFree / countAllData / 1000000).toFixed(2) + ' Mb');
                $('.total').text((sumOfDataMemoryTotal / countAllData / 1000000).toFixed(2) + ' Mb');

                //                console.log(nameOfServer);
                //                console.log("networksData");
                //                console.log(networksData);

                console.log(networksData[0]);


                let countOfNetworks = 0; //число networks в dataset
                //генерируем карточки network
                for (let key2 in networksData[0]) {
                    //                    console.log(data.dataset[key2].data.network[key2]);
                    let idNetworkInput = networksData[0][key2].name + '_' + nameOfServer;
                    let valueInput = networksData[0][key2].name + '_' + nameOfServer;

                    countOfNetworks++;

                    if ($(`#list_${idNetworkInput}`).length == false) {
                        $('.listOfNetworks').append(
                            $('<li>').attr({
                                id: `list_${idNetworkInput}`
                            }).append(
                                $('<input>').attr({
                                    type: 'radio',
                                    name: 'networks',
                                    id: idNetworkInput,
                                    value: valueInput
                                })
                            ).append(
                                $('<label>').attr({
                                    for: idNetworkInput
                                }).append(
                                    $('<div>').attr({
                                        class: 'infoNetwork positioningNetwork'
                                    }).append(
                                        $('<div>').attr({
                                            class: 'nameOfNetwork'
                                        }).append(
                                            $('<i>').attr({
                                                class: 'fas fa-wifi'
                                            })
                                        ).append(
                                            $('<span>').attr({
                                                class: `nameNetwork${key2}`
                                            })
                                        )
                                    ).append(
                                        $('<div>').attr({
                                            class: 'dataOfNetwork'
                                        }).append(
                                            $('<div>').attr({
                                                class: 'download'
                                            }).append(
                                                $('<i>').attr({
                                                    class: 'fas fa-arrow-down'
                                                })
                                            ).append(
                                                $('<span>').attr({
                                                    class: `downloadSpeed${key2} downloadSpeed`
                                                })
                                            )
                                        ).append(
                                            $('<div>').attr({
                                                class: 'upload'
                                            }).append(
                                                $('<i>').attr({
                                                    class: 'fas fa-arrow-up'
                                                })
                                            ).append(
                                                $('<span>').attr({
                                                    class: `uploadSpeed${key2} uploadSpeed`
                                                })
                                            )
                                        )
                                    )
                                )
                            )
                        );

                        $('.nameNetwork' + key2).text(networksData[0][key2].name);

                        //                    $('.nameNetwork1').text(data.dataset[key2].data.network[key2].name);
                        //                    $('.downloadSpeed1').text((data.dataset[key2].data.network[key2].in / 1000000).toFixed(1) + 'Mb/s');
                        //                    $('.uploadSpeed1').text((data.dataset[key2].data.network[key2].out / 1000000).toFixed(1) + 'Mb/s');



                        if ($(`#canvas_${networksData[0][key2].name}_${nameOfServer}`).length == false) {
                            $('.chartNetwork').append(`<canvas id="canvas_${networksData[0][key2].name}_${nameOfServer}"></canvas>`);
                            $(`#canvas_${networksData[0][key2].name}_${nameOfServer}`).css('display', 'none');
                        }
                        //                        console.log($(`#canvas_${networksData[0][key2].name}_${nameOfServer}`));

                    }
                }


                sumOfDownload = 0;
                sumOfUpload = 0;

                sumOfDownload1 = 0;
                sumOfUpload1 = 0;

                for (let i = 0; i < networksData.length; i++) {
                    for (let j = 0; j < countOfNetworks; j++) {
                        if (j == 0) {
                            sumOfDownload += networksData[i][j].in;
                            sumOfUpload += networksData[i][j].out;
                        }
                        if (j == 1) {
                            sumOfDownload1 += networksData[i][j].in;
                            sumOfUpload1 += networksData[i][j].out;
                        }
                    }
                }

                for (let j = 0; j < countOfNetworks; j++) {
                    if (j == 0) {
                        $('.downloadSpeed' + j).text((sumOfDownload / countAllData / 1000000).toFixed(1) + 'Mb/s');
                        $('.uploadSpeed' + j).text((sumOfUpload / countAllData / 1000000).toFixed(1) + 'Mb/s');
                    }
                    if (j == 1) {
                        $('.downloadSpeed' + j).text((sumOfDownload1 / countAllData / 1000000).toFixed(1) + 'Mb/s');
                        $('.uploadSpeed' + j).text((sumOfUpload1 / countAllData / 1000000).toFixed(1) + 'Mb/s');
                    }
                }



                console.log($('.downloadSpeed').length);
                console.log(countOfNetworks);


                //                console.log(checkedRadioNetwork);

                let networks = $('input[name=networks]');
                networks.on('change', function () {


                    $.get(
                        "/api/getAgentDataByInterval", {
                            public_key: nameOfServer,
                            start: startInterval,
                            end: endInterval
                        },
                        function (data) {
                            data = JSON.parse(data);
                            console.log(data);


                        });





                    dataNetworkDownload = [];
                    dataNetworkUpload = [];
                    sumOfDownload = 0;
                    sumOfUpload = 0;
                    //                    labelsTime = [];

                    checkedRadioNetwork = $(this).val();
                    console.log(checkedRadioNetwork);

                    //сoбираем данные network ля графика
                    for (let i = 0; i < networksData.length; i++) {
                        for (let j = 0; j < countOfNetworks; j++) {
                            if (checkedRadioNetwork.split('_')[0] == networksData[i][j].name) {
                                sumOfDownload += networksData[i][j].in;
                                sumOfUpload += networksData[i][j].out;
                                dataNetworkDownload.push(networksData[i][j].in / 1000000);
                                dataNetworkUpload.push(networksData[i][j].out / 1000000);
                            }
                        }
                    }


                    let networksChildren = $('.chartNetwork').children();
                    canvasesNetworkId = []; //массив для хранения идшников графиков network
                    networksChildren.each(function (index, elem) {
                        canvasesNetworkId.push($(networksChildren[index]).attr('id'));
                    });

                    for (let i = 0; i < canvasesNetworkId.length; i++) {
                        $(`#${canvasesNetworkId[i]}`).css('display', 'none');
                    }

                    $(`#canvas_${checkedRadioNetwork}`).css('display', 'block'); //отображаем нужный канвас 
                    prepareDataToShowNetwork();

                });

                prepareDataToShow();
            }
        });

    return 0;
}

//create select element
let select = function () {
    $('.select__icon').html('&#9660;');
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
        if ($('.select').hasClass('is-active')) {
            $('.select__icon').html('&#9650;');
        } else {
            $('.select__icon').html('&#9660;');
        }

    }

    function selectChoose() {
        let text = this.innerText;
        let select = this.closest('.select')
        let currentText = select.querySelector('.select__current');
        currentText.innerText = text;
        select.classList.remove('is-active');
        $('.select__icon').html('&#9660;');
    }
};
