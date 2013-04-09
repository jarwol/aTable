---
layout: default
---

#aTable

Fast, interactive Javascript table component built on Backbone.js.

---

#### Features
* **Fast and efficient** - Rows are added and removed as the table is scrolled, allowing aTable to be extremely fast even for very large datasets.
* **Sortable** - Click any column header to sort by that column.
* **Resizable columns** - Drag between column headers to resize columns.
* **Movable columns** - Click and drag column headers to move columns.
* **Intuitive API** - interact with the table programmatically to resize, move, hide, and show columns, and filter and sort the table.

---

#### Dependencies
* jQuery
* Backbone.js
* Underscore.js

---

#### Get started
Run the following commands to get the aTable source and build the library:
~~~
git clone https://github.com/jwoah12/aTable.git
cd aTable
npm install grunt-cli -g #if you don't already have grunt installed globally
npm install
grunt
~~~
Grunt will build the development and minified versions of the library (`dist/atable.js` and `dist/atable.min.js`).  Include one of these in your project along with `css/atable.css`, and you are ready to use aTable!

---

#### Browser Compatibility
* Chrome
* Firefox 5
* IE 10
* Safari 5
* Opera 12

The above browsers have full support for the interactive features in aTable. The table may render properly and be usable via the API in older versions. The web worker data interface requires a browser with Blob/BlobBuilder and Worker support.

---

#### Contributing
Pull requests are welcome!  Please follow these guidelines before submitting:
* Check out the [open issues](https://github.com/jwoah12/aTable/issues?state=open) and commit against one of those, or open your own issue first.
* Add unit tests to `test/tests.js` and make sure all tests pass.
* Try to stick to the existing code style as much as possible, and document new functions and classes with JSDoc.

---

#### The MIT License
Copyright (c) 2012-2013 Jared Wolinsky

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
