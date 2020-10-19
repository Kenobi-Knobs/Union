$(document).ready(function () {

    //checking authorized use or not
    $.get(
        "api/isAuth", {},
        function (data) {
            data = JSON.parse(data);

            if (data.auth == "true") {
                console.log("Auth is true");
                $('#userName').text(data.mail);
                $('html').css('display', 'block');
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
            let agents = [];
            data = JSON.parse(data);

            for (var key in data['agents']) {
                console.log(data.agents[key].public_key);
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
                )

                //pushing name of agents in array
                agents.push(data.agents[key].public_key)
            }

            //getting info from agent
            let servers = $('input[name=servers]');
            let interval;
            servers.on('change', function () {
                let currentServer = $(this).val();

                agents.forEach(function (item, index, array) {
                    if (currentServer == item) {
                        clearInterval(interval);
                        getInfoJSONFromAgent(currentServer);
                        interval = setInterval(getInfoJSONFromAgent, 65000, currentServer);
                    }
                });
            });
        }
    );

});



function getInfoJSONFromAgent(nameOfServer) {
    console.log("Getting from " + nameOfServer);

    $.get(
        "/api/getAgentData", {
            "public_key": nameOfServer
        },
        function (data) {
            data = JSON.parse(data);
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
            } else {
                for (var key in data['dataset']) {
                    $('.wired').text(data.dataset[key].data.memory.wired);
                    $('.total').text(data.dataset[key].data.memory.total);
                    $('.inactive').text(data.dataset[key].data.memory.inactive);
                    $('.active').text(data.dataset[key].data.memory.active);
                    $('.free').text(data.dataset[key].data.memory.free);

                    $('.system').text(data.dataset[key].data.cpu[0].system);
                    $('.idle').text(data.dataset[key].data.cpu[0].idle);
                    $('.num').text(data.dataset[key].data.cpu[0].num);
                    $('.user').text(data.dataset[key].data.cpu[0].user);
                }
            }
        }
    );

    return 0;
}
