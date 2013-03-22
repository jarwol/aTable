var rows = [
    ["Kimberly", "Hodges", "Centennial", "887-527-3183"],
    ["Peyton", "Sherlock", "Allentown", "880-475-3976"],
    ["Chloe", "Gate", "Elgin", "880-411-3174"],
    ["Eva", "Milton", "AnnArbor", "877-478-2786"],
    ["Genesis", "Goldman", "Frisco", "806-584-3529"],
    ["Brooke", "Carey", "Augusta", "813-467-2782"],
    ["Emily", "Carter", "Flint", "866-551-3323"],
    ["Paige", "Hodges", "Gresham", "883-541-2300"],
    ["Samantha", "Hancock", "Bakersfield", "852-452-2327"],
    ["Mariah", "Turner", "Chattanooga", "869-418-2343"],
    ["Madeline", "Nathan", "Columbia", "883-562-3290"],
    ["Maria", "Carrington", "CapeCoral", "851-541-2621"],
    ["Madison", "Chandter", "Elgin", "851-488-2807"],
    ["Audrey", "Gibbs", "Downey", "837-583-2478"],
    ["Victoria", "Davidson", "Buffalo", "896-592-2625"],
    ["Katelyn", "Hailey", "CedarRapids", "846-590-3667"],
    ["Emma", "Wesley", "CoralSprings", "881-446-3318"],
    ["Ella", "Milton", "Augusta", "830-473-3626"],
    ["Addison", "Nash", "Erie", "808-561-3865"],
    ["Brianna", "Murphy", "Chesapeake", "886-556-2862"],
    ["Ella", "Thorndike", "Bakersfield", "824-423-3094"],
    ["Riley", "Wesley", "Carrollton", "801-551-2291"],
    ["Addison", "Thornton", "FortWayne", "825-401-3955"],
    ["Ella", "Michaelson", "Fairfield", "801-448-3699"],
    ["Sofia", "Mercer", "Denton", "895-435-3107"],
    ["Madelyn", "Wayne", "Athens", "828-593-3278"],
    ["Julia", "Daniels", "Escondido", "897-455-3432"],
    ["Zoey", "Bush", "CorpusChristi", "866-475-2216"],
    ["Mariah", "Oliver", "AmarilloAnaheim", "839-498-2802"],
    ["Alexandra", "Adamson", "Athens", "811-567-2132"],
    ["Madelyn", "Croftoon", "Daly", "841-442-2282"],
    ["Lauren", "WifKinson", "Flint", "886-441-3285"],
    ["Kaylee", "Cook", "Augusta", "833-437-3410"],
    ["Anna", "Watson", "Centennial", "863-426-3530"],
    ["Julia", "Ward", "IdahoBoston", "854-534-2168"],
    ["Payton", "Hailey", "Chicago", "811-445-2085"],
    ["Destiny", "Otis", "GrandPrairie", "845-406-2010"],
    ["Lauren", "Fulton", "Denver", "850-420-2768"],
    ["Sofia", "Campbell", "GrandRapids", "844-472-3867"],
    ["Katherine", "Nelson", "Centennial", "846-512-3830"],
    ["Aubrey", "Miller", "Clearwater", "879-550-2787"],
    ["Jasmine", "Michaelson", "Charleston", "821-507-2219"],
    ["Kaitlyn", "Thomson", "Cincinnati", "838-594-2994"],
    ["Madison", "Conors", "Daly", "864-568-2905"],
    ["Hannah", "Gardner", "AnnArbor", "825-463-2130"],
    ["Jasmine", "Campbell", "Daly", "871-409-3442"],
    ["Autumn", "Vance", "Springs", "883-539-3986"],
    ["Olivia", "Neal", "Cincinnati", "895-566-2246"],
    ["Sarah", "Vaughan", "AmarilloAnaheim", "885-416-2901"],
    ["Valeria", "Oldridge", "Greensboro", "881-417-3928"]
];


$(document).ready(function () {
    var table = new ATable({
        dataFunction : function (atable) {
            atable.receivedData(rows);
        },
        columns : [
            {name : "first", label : "First Name"},
            {name : "last", label : "Last Name"},
            {name : "city", label : "City"},
            {name : "phone", label : "Phone #"}
        ],
        el : "#staticData10Rows",
        height : 600
    });
    table.render();
    table.hideColumn("phone");

    var bigTable = new ATable({
        dataFunction : "fetchStockData",
        columns : [
            {name : "symbol", label : "Symbol"},
            {name : "company", label : "Company Name"},
            {name : "close", label : "Prev. Close"},
            {name : "open", label : "Open"},
            {name : "bid", label : "Bid"},
            {name : "ask", label : "Ask"},
            {name : "notes", label : "Notes"}
        ],
        el : "#dynamicAjax",
        height : 600
    });
    //bigTable.render();
});
