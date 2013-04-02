#aTable

Fast, interactive Javascript table component built on Backbone.js. Simply pass in a list of columns and a function that returns the table's dataset (2D array of cell values), and you'll have a beautifully-rendered HTML table with an extensive feature set.
####Features
* **Small DOM footprint** - Rows are added and removed as the table is scrolled, allowing aTable to be extremely fast even for huge datasets.
* **Sortable** - Click any column header to sort by that column.
* **Resizable columns** - Drag between column headers to resize columns.
* **Movable columns** - Click and drag column headers to move columns.
* **Easy API** - interact with the table programmatically
  * Resize a column  - `atable.resizeColumn(columnIndex, newWidth, callback)`
  * Move a column    - `atable.moveColumn(sourceIndex, destIndex)`
  * Sort the table   - `atable.sort(sortColumn, sortDescending)`

####Dependencies
* jQuery
* Backbone.js
* Underscore.js

####Get started
Run the following commands to get the aTable source and build the library:
```
git clone https://github.com/jwoah12/aTable.git
cd aTable
npm install grunt-cli -g #if you don't already have grunt installed globally
npm install
grunt
```
Now include either `dist/atable.js` or `dist/atable.min.js` in your webpage, and you're ready to use aTable!

####Here's an example
Take advantage of the concurrency of [Web Workers](https://developer.mozilla.org/en-US/docs/DOM/Using_web_workers) by including a function called `fetchData()` inside its own script tag.
```html
<script id="loadMyData">
  function fetchData(){
    return 
      [
        ["Jared", "Wolinsky", 27, "867-5309"],
        ["Alec", "Baldwin", 54, "1-800-BALDWIN"]
      ];
  }
</script>
```
In your javascript, provide the id of your fetchData function's script tag along with column definitions and a parent element:
```javascript
var atable = new ATable({
  fetchData : "loadMydata",
  columns : [
    { name : "First Name" },
    { name : "Last Name" },
    { name : "Age" },
    { name : "Phone #" }
  ],
  el : "body",
  height : 400
}).render();
```

####The MIT License (MIT)
Copyright (c) 2013 Jared Wolinsky

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
