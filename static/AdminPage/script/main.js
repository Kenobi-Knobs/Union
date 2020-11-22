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

    $('#average').on('click', function () {
        $(location).attr('href', '/statistic');
    });

    $('#monitoring').on('click', function () {
        $(location).attr('href', '/url-monitor');
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

    $('#find').on('click', function () {
        getUsers();
    });
});

function upgradeUser(mailToUpgrade, i) {
    $.get(
        'api/upgradeUser', {
            mail: mailToUpgrade,
        },
        function (data) {
            data = JSON.parse(data);
            console.log(data);
            if (data.user_upgrade == 'true') {
                $('.popupWrapper').fadeIn(500);
                $('#popupInfo').text(mailToUpgrade + ' was successfully upgraded to premium');
                $(`.status_${i}`).css('backgroundColor', '#ACACAC');
                $(`.status_${i}`).css('cursor', 'auto');
                $(`.status_${i} > span`).text('Premium plan');
                getUsers();
            }
        }
    );
}

function deleteUser(mailToDelete) {
    $.get(
        'api/deleteUser', {
            mail: mailToDelete
        }
    );
}

function getUsers() {
    $('#usersList').empty();
    let usersList = []; //массив всех пользователей
    $.get(
        'api/getUsers', {},
        function (data) {
            data = JSON.parse(data);
            console.log(data);

            for (let i = 0; i < data.users.length; i++) {
                usersList.push(data.users[i]);
            }

            for (let i = 0; i < usersList.length; i++) {
                if ($('#mail').val().toLowerCase() == '*' || $('#mail').val().toLowerCase() == 'all') {

                    $('#usersList').append(
                        $('<li>').attr({
                            id: `list_${i}`
                        }).append(
                            $('<div>').attr({
                                class: `select__options option_${i}`
                            }).append(
                                $('<div>').attr({
                                    class: `select__status status_${i} status_${usersList[i].mail}`
                                }).append(
                                    $('<span>').text('Upgrade plan')
                                )
                            ).append(
                                $('<div>').attr({
                                    class: `select__remove remove_${i} remove_${usersList[i].mail}`
                                }).append(
                                    $('<span>').text('Remove')
                                )
                            )
                        ).append(
                            $('<div>').attr({
                                class: `selectWrapper wrapper_${i}`
                            }).append(
                                $('<div>').attr({
                                    class: `select select_${i}`
                                }).append(
                                    $('<div>').attr({
                                        class: `select__header header_${i}`
                                    }).append(
                                        $('<div>').attr({
                                            class: `select__mail mail_${i}`
                                        }).append(
                                            $('<span>').attr({
                                                class: `select__current current_${i}`
                                            }).text(data.users[i].mail)
                                        )
                                    )
                                )
                            )
                        )
                    );


                    if (usersList[i].agents.length > 0) {
                        $(`.mail_${i}`).append(
                            $('<div>').attr({
                                class: `select__icon icon_${i}`
                            })
                        );

                        $(`.select_${i}`).append(
                            $('<div>').attr({
                                class: `select__body body_${i}`
                            }).append(
                                $('<div>').attr({
                                    class: `select__item item_${i}`,
                                    id: `infoUser`
                                }).append(
                                    $('<span>').attr({
                                        class: `agentTitle`
                                    }).text('Agents:')
                                ).append(
                                    $('<ul>').attr({
                                        class: `agentList agentList_${i}`
                                    })
                                )
                            )
                        )
                    }

                }
                if ($('#mail').val().toLowerCase() == usersList[i].mail) {

                    $('#usersList').append(
                        $('<li>').attr({
                            id: `list_${i}`
                        }).append(
                            $('<div>').attr({
                                class: `select__options option_${i}`
                            }).append(
                                $('<div>').attr({
                                    class: `select__status status_${i} status_${usersList[i].mail}`
                                }).append(
                                    $('<span>').text('Upgrade plan')
                                )
                            ).append(
                                $('<div>').attr({
                                    class: `select__remove remove_${i} remove_${usersList[i].mail}`
                                }).append(
                                    $('<span>').text('Remove')
                                )
                            )
                        ).append(
                            $('<div>').attr({
                                class: `selectWrapper wrapper_${i}`
                            }).append(
                                $('<div>').attr({
                                    class: `select select_${i}`
                                }).append(
                                    $('<div>').attr({
                                        class: `select__header header_${i}`
                                    }).append(
                                        $('<div>').attr({
                                            class: `select__mail mail_${i}`
                                        }).append(
                                            $('<span>').attr({
                                                class: `select__current current_${i}`
                                            }).text(data.users[i].mail)
                                        )
                                    )
                                )
                            )
                        )
                    );


                    if (usersList[i].agents.length > 0) {
                        $(`.mail_${i}`).append(
                            $('<div>').attr({
                                class: `select__icon icon_${i}`
                            })
                        );

                        $(`.select_${i}`).append(
                            $('<div>').attr({
                                class: `select__body body_${i}`
                            }).append(
                                $('<div>').attr({
                                    class: `select__item item_${i}`,
                                    id: `infoUser`
                                }).append(
                                    $('<span>').attr({
                                        class: `agentTitle`
                                    }).text('Agents:')
                                ).append(
                                    $('<ul>').attr({
                                        class: `agentList agentList_${i}`
                                    })
                                )
                            )
                        )
                    }
                }
            }

            console.log(usersList);

            //записываем какие агенты есть у пользователя
            //если у пользователя есть премиум, то меняем кнопку что у нег оесть премиум 
            for (let i = 0; i < data.users.length; i++) {
                for (let j = 0; j < data.users[i].agents.length; j++) {
                    $(`.agentList_${i}`).append(
                        $('<li>').append(
                            $('<span>').text(data.users[i].agents[j].public_key)
                        )
                    );
                }
                if (data.users[i].settings.status == 'premium_user') {
                    $(`.status_${i}`).css('backgroundColor', '#ACACAC');
                    $(`.status_${i}`).css('cursor', 'auto');
                    $(`.status_${i} > span`).text('Premium plan');
                }

                if (data.users[i].settings.status == 'admin') {
                    $(`.status_${i}`).css('backgroundColor', '#ACACAC');
                    $(`.status_${i}`).css('cursor', 'auto');
                    $(`.status_${i} > span`).text('Admin');
                    $(`.remove_${i}`).css('display', 'none');
                }

                if (data.users[i].settings.status == 'user') { //ЗАМЕНИТЬ НА ЮЗЕР!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                    document.querySelectorAll(`.status_${i}`).forEach(item => { //изменить статус на премиум 
                        item.addEventListener('click', function () {
                            let mailToUpgrade = item.className.split(/\s+/)[2].split('_')[1];
                            upgradeUser(mailToUpgrade, i);
                        });
                    });
                }

                if (data.users[i].settings.status == 'user' || data.users[i].settings.status == 'premium_user') {
                    document.querySelectorAll(`.remove_${i}`).forEach(item => { //delete
                        item.addEventListener('click', showPopupDelete);

                        function showPopupDelete() {
                            let mailToDelete = item.className.split(/\s+/)[2].split('_')[1];
                            console.log(mailToDelete);
                            deleteUser(mailToDelete);
                            $('.popupWrapper').fadeIn(500);
                            $('#popupInfo').text(mailToDelete + ' was successfully deleted');
                            $(`#list_${i}`).slideUp();
                            $(`#list_${i}`).remove();
                        }
                    });
                }
            }



            $('#understandInfo').on('click', function () {
                $('.popupWrapper').fadeOut(500);
                $("body").css('position', 'static');
            });


            //create select element
            let select = function () {
                $('.select__icon').html('&#9660;');
                let selectHeader = document.querySelectorAll('.select__header');
                selectHeader.forEach(item => {
                    item.addEventListener('click', selectToggle);
                });

                function selectToggle() {
                    let parent = $(this).parent();
                    this.parentElement.classList.toggle('is-active');

                    for (let i = 0; i < data.users.length; i++) {
                        for (let j = 0; j < data.users[i].agents.length; j++) {
                            if ($(`.select_${i}`).hasClass('is-active')) {
                                $(`.icon_${i}`).html('&#9650;');
                                $(`.header_${i}`).css('borderRadius', '0.5em 0.5em 0 0');
                                $(`.header_${i}`).css('borderBottom', '0');
                            } else {
                                $(`.icon_${i}`).html('&#9660;');
                                $(`.header_${i}`).css('borderRadius', '0.5em');
                                $(`.header_${i}`).css('borderBottom', '0.03em solid #cccccc');
                            }
                        }
                    }
                }
            };
            select();
        }
    );
}
