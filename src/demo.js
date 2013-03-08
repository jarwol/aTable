$(document).ready(function () {
    var table = new ATable({
        fetchData : "fetchData",
        sortable : false,
        columns : [
            {name : "Column 1"},
            {name : "Column 2", sortable : true},
            {name : "Column 3"},
            {name : "Column 4"}
        ],
        el : "#content",
        height : 600
    });
    table.render();
});