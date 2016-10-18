Ext.ns('AgendaBuilder');

Ext.define('AgendaRow', {
    extend: 'Ext.Component',
    xtype: 'agendarow-ctr',
	leadColumns: 2,
    hoursColumns: 36, //30min of 18 hrs
    trailingColumns: 1,
    defaultColStyle: null,
    defaultColClass: null,
    evenColClass: null,
    oddColClass: null,
    data: null,
    // Primitives are always OK on prototypes
    parameter: false,
    columns: [],
    initComponent: function() {
        this.tpl = new Ext.XTemplate(
        	'<table style="width:100%;height:100%;" border="0" cellspacing="0">',
        		'<tpl for="columns">',
		            '<col width="{[this.getColumnWidth(xindex)]} max-width="{[this.getColumnWidth(xindex)]}">',
	        	'</tpl>',
        		'<tr>',
		        	'<tpl for="columns">',
		            	'<td {[this.getData()]} {[this.getId({xindex})]} class="{cls}" style="{style}">{parent.columnCount} {html}', 
		        		'</td>',
		        	'</tpl>',
		        '</tr>', 
        	'</table>',
            {
                strict: true,
                parameter: this.parameter,
                leadColumns: this.leadColumns,
			    hoursColumns: this.hoursColumns, //30min of 18 hrs
			    trailingColumns: this.trailingColumns,
			    id: this.id,
                data: this.data,
                getData: function(){
                    
                    return '';
                },
			    getId: function(index){
			    	return 'id="' + this.id + '-col-' + index.xindex + '"';
			    },
                getColumnWidth: function(i){
                	var totalColumns = (this.leadColumns * 2) + this.hoursColumns + (this.trailingColumns * 2);
                	if (i < this.leadColumns - 1)
                	{
                		return '52px';
                		//return '10%';
                	}
                	else if (i > this.leadColumns && i <= (this.leadColumns + this.hoursColumns))
                	{
                		return (84/totalColumns) + '%';
                	}
                	else 
                	{
                		return '5%';
                	}           	
                }
            }
        );
		var totalColumns = this.leadColumns + this.hoursColumns + this.trailingColumns; 
		var columns = [];
		var isOdd= function(num) { return num % 2;}

		//prime all the columns
		for(i = 0; i < totalColumns; i++)
    	{
	    	var col = {html: ''};
	    	if (this.defaultColStyle)
	    		col.style = this.defaultColStyle;
	    	if (this.defaultColClass)
	    		col.cls = this.defaultColClass;
	    	if (this.evenColClass && !isOdd(i))
	    		col.cls = this.evenColClass;
	    	if (this.oddColClass && isOdd(i))
	    		col.cls = this.oddColClass;
	    	columns.push(col);	    
	    }
	    //loop through the columns passed 
	    Ext.each(this.columns, function(c){
	    	if (c && c.Index != null && c.Index != undefined)
	    	{
	    		columns[c.Index] = Ext.apply(columns[c.Index], c);
	    	}
	    });

        this.data = {columnWidth: (100/this.columns.length) + '%', columns: columns}; 
        this.callParent(arguments);
    }
});