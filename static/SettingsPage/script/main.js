$(document).ready(function () {

    $(".quit").on('click', function () {
        $(location).attr('href', '/logout');
    });

    $('#home').on('click', function () {
        $(location).attr('href', '/');
    });

    $('#settings').on('click', function () {
        $(location).attr('href', '/settings');
    });

    //adding servers
    $('#Save').on('click', function () {
        let public_key = $('#addPublicKey').val();
        let secret_key = $('#addSecretKey').val();
        let host = $('#addHost').val();
        $.post(
            "/api/addAgent", {
                public_key: public_key,
                secret_key: secret_key,
                host: host
            },
            function (data) {
                data = JSON.parse(data);
                console.log(data);

                if (data.add == 'true' && data.info == 'Added') {
                    location.reload();
                }
                if (data.add == 'false' && data.info == 'Is exist') {
                    console.log('server is exist');
                }
            }
        );
    });

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

    $.get(
        "/api/getAgentList", {},
        function (data) {
            data = JSON.parse(data);

            for (var key in data['agents']) {
                //                console.log(data.agents[key].public_key);
                $('.listOfServers').append(
                    $('<li>').append(
                        $('<span>').attr({
                            class: "nameServer",
                            id: data.agents[key].public_key,
                        }).text(data.agents[key].public_key)
                    ).append(
                        $('<span>').attr({
                            class: "trashIcon",
                            id: data.agents[key].public_key + "_Delete"
                        }).append(
                            $('<i>').attr({
                                class: "far fa-trash-alt",
                            })
                        )
                    )
                );
            }

            $('#addNew').on('click', function () {
                $('.formWrapper').css('display', 'block');
                $('.form').css('display', 'block');
                $('.infoDeletingWrapper').css('display', 'none');
                $('.titleCard').text('Add new server');
                $('.infoWrapper').fadeIn(300);
                setTimeout(function () {
                    $('.infoWrapper').css({
                        'display': 'block'
                    });
                }, 400);

            });

            $('#close').on('click', function () {
                $('.formWrapper').css('display', 'none');
                $('.infoDeletingWrapper').css('display', 'none');
                $('.infoWrapper').fadeOut(300);
                setTimeout(function () {
                    $('.infoWrapper').css({
                        'display': 'none'
                    });
                }, 400);

            });

            //deleting servers
            $('.trashIcon').on('click', function () {
                let public_keyToDelete = $(this).attr('id').split('_')[0];

                $('.formWrapper').css('display', 'block');
                $('.form').css('display', 'none');
                $('.titleCard').text('Delete server');
                $('.infoDeletingWrapper').css('display', 'block');
                $('#infoDelete').text(`Are you sure you want to delete ${public_keyToDelete}?`);
                $('.infoWrapper').fadeIn(300);

                $('#Yes').on('click', function () {
                    $.post(
                        "/api/deleteAgent", {
                            public_key: public_keyToDelete
                        },
                        function (data) {
                            data = JSON.parse(data);
                            console.log(data);

                            if (data.delete == 'true') {
                                location.reload();
                            }
                        }
                    );
                });

                setTimeout(function () {
                    $('.infoWrapper').css({
                        'display': 'block'
                    });
                }, 400);
            });

            $('#Cancel').on('click', function () {
                $('.formWrapper').css('display', 'none');
                $('.infoDeletingWrapper').css('display', 'none');
                $('.infoWrapper').fadeOut(300);
                setTimeout(function () {
                    $('.infoWrapper').css({
                        'display': 'none'
                    });
                }, 400);
            });
        }
    );

});
