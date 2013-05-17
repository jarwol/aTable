var Column = Backbone.Model.extend(
    /** @lends Column.prototype */
    {
        /**
         * @class Backbone Model representation of a table column
         * @augments Backbone.Model
         * @constructs
         */
        initialize : function () {
            this.on("change:label", function(col, newLabel){
               var th = this.get("element");
                if(th){
                    for(var i = 0; i < th[0].firstChild.childNodes.length; i++){
                        var node = th[0].firstChild.childNodes[i];
                        if(node.nodeType === 3){
                            node.textContent = newLabel;
                            break;
                        }
                    }
                }
            });
        },
        idAttribute : "name"
    }
);