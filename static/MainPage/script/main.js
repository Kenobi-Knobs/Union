$(document).ready(function () {

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
                //                console.log(data.agents[key].public_key);
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
                //                console.log(agents);
            }

            //getting info from agent
            let servers = $('input[name=servers]');
            let interval;
            servers.on('change', function () {
                let serverName = $(this).val();
                agents.forEach(function (item, index, array) {
                    if (serverName == item) {
                        clearInterval(interval);
                        getInfoJSONFromAgent(serverName);
                        interval = setInterval(getInfoJSONFromAgent, 65000, serverName);
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
            $('.wired').text(data.data.memory.wired);
            $('.total').text(data.data.memory.total);
            $('.inactive').text(data.data.memory.inactive);
            $('.active').text(data.data.memory.active);
            $('.free').text(data.data.memory.free);

            $('.system').text(data.data.cpu[0].system);
            $('.idle').text(data.data.cpu[0].idle);
            $('.num').text(data.data.cpu[0].num);
            $('.user').text(data.data.cpu[0].user);
        }
    );

    return 0;
}
