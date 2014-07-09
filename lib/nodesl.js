var esl = require('modesl'),
conn = new esl.Connection('192.168.1.15', 8021, 'ClueCon', function() {
    conn.api('reloadxml', function(res) {
        //res is an esl.Event instance
        console.log(res.getBody());
    });
});
