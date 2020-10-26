let dataDisksFree = [];
let dataDisksTotal = [];
let dataMemoryWired = [];
let dataMemoryFree = [];
let dataMemoryTotal = [];

let servers;
let agents = [];
let checkedRadio;

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

    //    drawChart();

    //getting agents
    console.log("Getting agents");

    $.get(
        "/api/getAgentList", {},
        function (data) {
            data = JSON.parse(data);

            for (var key in data['agents']) {
                console.log(data.agents[key].public_key);
                //                if (key == 0) {
                //                    $('.listOfServers').append(
                //                        $('<li>').append(
                //                            $('<input>').attr({
                //                                type: 'radio',
                //                                name: 'servers',
                //                                id: data.agents[key].public_key,
                //                                value: data.agents[key].public_key,
                //                                checked: true
                //                            })
                //                        ).append(
                //                            $('<label>').attr({
                //                                for: data.agents[key].public_key
                //                            }).text(data.agents[key].public_key)
                //                        )
                //                    );
                //                } else {
                $('.listOfServers').append(
                    $('<li>').append(
                        $('<input>').attr({
                            type: 'radio',
                            name: 'servers',
                            id: data.agents[key].public_key,
                            value: data.agents[key].public_key
                        })
                    ).append(
                        $('<label>').attr({
                            for: data.agents[key].public_key
                        }).text(data.agents[key].public_key)
                    )
                );
                //                }


                //pushing name of agents in array
                agents.push(data.agents[key].public_key)
            }

            //getting info from agent
            servers = $('input[name=servers]');

            let interval;
            servers.on('change', function () {
                let checkedRadio = $(this).val();
                //                console.log(checkedRadio);

                agents.forEach(function (item, index, array) {

                    if ($(`#${item}_CPU`).length == false || $(`#${item}_Memory`).length == false || $(`#${item}_Disks`).length == false) {
                        $('.chart').append(`<canvas id="${item}_CPU"></canvas>`);
                        $('.chart').append(`<canvas id="${item}_Memory"></canvas>`);
                        $('.chart').append(`<canvas id="${item}_Disks"></canvas>`);

                        $(`#${item}_CPU`).css('display', 'none');
                        $(`#${item}_Memory`).css('display', 'none');
                        $(`#${item}_Disks`).css('display', 'none');
                    }

                    if (checkedRadio == item) {
                        clearInterval(interval);
                        getInfoJSONFromAgent(checkedRadio);
                        interval = setInterval(getInfoJSONFromAgent, 65000, checkedRadio);
                    }
                });
            });
        }
    );


    //    setInterval(wichChartToShow, 1000);

    $('#itemCpu').on('click', function () {
        let canvases = $('.chart').children();
        let allCanvases = [];
        allCanvases.push(canvases);
        console.log(allCanvases);
        findCheckedRadio();
        //        if (checkedRadio == ) {
        //
        //        }
    });


});


function findCheckedRadio() {
    $("input:radio:checked").each(function () {
        checkedRadio = $(this).val();
    });
}


function getInfoJSONFromAgent(nameOfServer) {
    console.log("Getting from " + nameOfServer);

    $.get(
        "/api/getAgentData", {
            "public_key": nameOfServer,
            "count": 5
        },
        function (data) {
            data = JSON.parse(data);
            console.log(data);

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

                let serverTime = [];
                let labelsTime = [];
                let dataSystem = [];
                let dataUser = [];
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

                    dataDisksFree.push((data.dataset[key].data.disks[0].free / 1000000).toFixed(1));
                    dataDisksTotal.push((data.dataset[key].data.disks[0].total / 1000000).toFixed(1));

                    dataMemoryWired.push((data.dataset[0].data.memory.wired / 1000000).toFixed(2));
                    dataMemoryFree.push((data.dataset[0].data.memory.free / 1000000).toFixed(2));
                    dataMemoryTotal.push((data.dataset[0].data.memory.total / 1000000).toFixed(2));
                }

                labelsTime.reverse();
                dataSystem.reverse();
                dataUser.reverse();
                dataDisksFree.reverse();
                dataDisksTotal.reverse();
                dataMemoryWired.reverse();
                dataMemoryFree.reverse();
                dataMemoryTotal.reverse();

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
