$(document).ready(function () {
    var table = new Table({
        fetchData : "fetchData",
        columns : [
            {name : "Column 1"},
            {name : "Column 2"},
            {name : "Column 3"},
            {name : "Column 4"}
        ],
        el : "#content",
        height : 600
    });
    table.render();
});