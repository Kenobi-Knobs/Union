$(document).ready(function () {


    //    $('input').keydown(function (e) {
    //        if (e.keyCode === 13) {
    //            addNewServer();
    //        }
    //    });


    $(".quit").on('click', function () {
        $(location).attr('href', '/logout');
    });

    $('#home').on('click', function () {
        $(location).attr('href', '/');
    });

    $('#settings').on('click', function () {
        $(location).attr('href', '/settings');
    });

    $('#average').on('click', function () {
        $(location).attr('href', '/statistic');
    });

    //смотрим статус юзера, является ли он админом
    $.get('api/getUser', {}, function (data) {
        data = JSON.parse(data);
        console.log(data.settings.status);

        if (data.settings.status == 'admin') {
            $('#settingsList').append(
                $('<li>').append(
                    $('<div>').attr({
                        class: 'option'
                    }).append(
                        $('<span>').attr({
                            class: 'titleOption'
                        }).text('Admin')
                    ).append(
                        $('<span>').html(`Go to <a href='/admin'> admin page</a>`)
                    )
                )
            )
        }
    });



    //validate adding servers
    $('#formAddServer').validate({
        rules: {
            public: {
                required: true,
                validPublic: true
            },
            secret: {
                required: true,
                validSecret: true
            },
            host: {
                required: true,
                validHost: true
            }
        },
        messages: {
            public: {
                required: "This field must be filled",
                validPublic: "First character must be letter. Without spaces"
            },
            secret: {
                required: "This field must be filled",
                validSecret: "Without spaces"
            },
            host: {
                required: "This field must be filled",
                validHost: "At least 1 letter then dot then at least 2 letters"
            }
        },
        submitHandler: function () {
            addNewServer();
        }
    });

    $.validator.addMethod("validPublic", function (value, element) {
        return this.optional(element) || /^[a-zA-Z]+[a-zA-Z0-9_-]*$/gi.test(value);
    });
    $.validator.addMethod("validSecret", function (value, element) {
        return this.optional(element) || /^[a-zA-Z0-9]+$/gi.test(value);
    });
    $.validator.addMethod("validHost", function (value, element) {
        return this.optional(element) || /^[\w0-9.]+\.\w{2,}$/gi.test(value);
    });


    //adding servers
    //    $('#Save').on('click', function () {
    //        addNewServer();
    //    });

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

                $('#addPublicKey').val('');
                $('#addSecretKey').val('');
                $('#addHost').val('');

                $('.formWrapper').css('display', 'none');
                $('.infoDeletingWrapper').css('display', 'none');
                $('.emptyWrapper').css('display', 'none');
                $('.infoWrapper').fadeOut(300);

                setTimeout(function () {
                    $('.infoWrapper').css({
                        'display': 'none'
                    });
                }, 400);

            });

            //deleting servers
            $('.trashIcon').on('click', function () {
                let public_keyToDelete = undefined;
                public_keyToDelete = $(this).attr('id').split('_')[0];

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
                            //                            console.log(data);

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


function addNewServer() {
    let public_key = $('#addPublicKey').val().replace(/\s/gi, '');
    let secret_key = $('#addSecretKey').val().replace(/\s/gi, '');
    let host = $('#addHost').val().replace(/\s/gi, '');
    $.post(
        "/api/addAgent", {
            public_key: public_key,
            secret_key: secret_key,
            host: host
        },
        function (data) {
            data = JSON.parse(data);
            //                    console.log(data);

            if (data.add == 'true' && data.info == 'Added') {
                location.reload();
                $('.emptyWrapper').css('display', 'none');
            }
            if (data.add == 'false' && data.info == 'Is exist') {
                $('#info').text('This server is already exist');
                $('.emptyWrapper').fadeIn(300);
            }
        }
    );
}
