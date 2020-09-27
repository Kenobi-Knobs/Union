$(document).ready(function () {
    let gor = $('#gor');
    let t1 = $('#t1');
    let t2 = $('#t2');
    let t5 = $('#t5');

    gor.on('click', function () {
        $(this).prop('checked', true);
        if ($(this).prop('checked') == true) {

            setInterval(getJSON, 5000);

            function getJSON() {
                console.log("Gor is starting");

                $.get(
                    "http://t5.tss2020.site/api/getAgentData", {
                        "public_key": "gor-tss"
                    },
                    function (data) {
                        data = JSON.parse(data);
                        console.log(data.data.memory.wired);
                    }
                );
            }
        }
    });

    t1.on('click', function () {
        $(this).prop('checked', true);
        if ($(this).prop('checked') == true) {
            console.log("t1");
        }
    });

    t2.on('click', function () {
        $(this).prop('checked', true);
        if ($(this).prop('checked') == true) {
            console.log("t2");
        }
    });

    t5.on('click', function () {
        $(this).prop('checked', true);
        if ($(this).prop('checked') == true) {
            console.log("t5");
        }
    })
});
