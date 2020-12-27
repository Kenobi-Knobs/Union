    let href = $(location).attr('href');
    let tokenArray = href.split("/");
    let token = tokenArray[tokenArray.length - 1];

    $(document).ready(function () {
        $.get("/api/getDashboard", {
                token: token
            })
            .done(function (data) {
                data = JSON.parse(data);
                console.log(data);
                $("#userName").text(data.mail);
                $(".userText").html(data.text);

                if (data.urls[0] == null) {
                    $('.monitoringInfoWrapper').css('display', 'none');
                } else {
                    $('.monitoringInfoWrapper').slideDown(300);
                    for (let key in data.urls) {

                        let date = new Date(data.urls[key].last_ping_time * 1000);
                        let year = date.getFullYear();
                        let month = date.getMonth() + 1;
                        let day = date.getDate();
                        let hour = date.getHours();
                        let minutes = date.getMinutes();

                        let lastPingTime = day + '-' + month + '-' + year + ' ' + hour + ':' + minutes;

                        $('.card').append(
                            $('<div>').attr({
                                class: 'infoWrapper'
                            }).append(
                                $('<div>').attr({
                                    class: 'info'
                                }).append(
                                    $('<div>').attr({
                                        class: 'addressAndStatusWrapper'
                                    }).append(
                                        $('<div>').attr({
                                            class: 'titles'
                                        }).append(
                                            $('<div>').attr({
                                                class: 'addressTitleWrapper'
                                            }).append(
                                                $('<div>').append(
                                                    $('<span>').attr({
                                                        class: 'addressTitle titleMonitoring'
                                                    }).text('Address')
                                                )
                                            )
                                        )
                                    ).append(
                                        $('<div>').attr({
                                            class: 'titlesInfo'
                                        }).append(
                                            $('<div>').append(
                                                $('<input>').attr({
                                                    type: 'text',
                                                    class: 'addressInput',
                                                    readonly: true,
                                                    value: data.urls[key].url
                                                })
                                            )
                                        )
                                    )
                                )
                                .append(
                                    $('<div>').attr({
                                        class: 'configWrapper'
                                    }).append(
                                        $('<div>').attr({
                                            class: 'config'
                                        }).append(
                                            $('<div>').attr({
                                                class: 'infoTitleWrapper'
                                            }).append(
                                                $('<span>').attr({
                                                    class: 'configTitle titleMonitoring'
                                                }).text('Info')
                                            )
                                        ).append(
                                            $('<div>').attr({
                                                class: 'configInfoWrapper'
                                            }).append(
                                                $('<div>').attr({
                                                    class: 'configInfo'
                                                }).append(
                                                    $('<div>').append(
                                                        $('<span>').attr({
                                                            class: 'lastPingTime'
                                                        }).text(lastPingTime)
                                                    )
                                                ).append(
                                                    $('<div>').append(
                                                        $('<span>').attr({
                                                            class: 'lastCode'
                                                        }).text(data.urls[key].last_code)
                                                    )
                                                )
                                            ).append(
                                                $('<div>').attr({
                                                    class: 'titleConfigInfo'
                                                }).append(
                                                    $('<div>').append(
                                                        $('<span>').attr({
                                                            class: 'titmeLastPingTime'
                                                        }).text('Last ping time')
                                                    )
                                                ).append(
                                                    $('<div>').append(
                                                        $('<span>').attr({
                                                            class: 'titmeLastPingTime'
                                                        }).text('Last code')
                                                    )
                                                )
                                            )
                                        ).append(
                                            $('<div>').attr({
                                                class: 'line'
                                            })
                                        )
                                    )
                                )
                            )
                        );
                    }
                }
            });
    });
