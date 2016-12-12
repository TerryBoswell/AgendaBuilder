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
    dataField: null,
    // Primitives are always OK on prototypes
    parameter: false,
	observer: null,	
    columns: [],
    initComponent: function() {
        this.tpl = new Ext.XTemplate(
        	'<table style="width:100%;height:100%;" border="0" cellspacing="0">',
        		'<tpl for="columns">',
		            '<col width="{[this.getColumnWidth(xindex)]} max-width="{[this.getColumnWidth(xindex)]}">',
	        	'</tpl>',
        		'<tr>',
		        	'<tpl for="columns">',
		            	'<td {[this.getData(xindex)]} {[this.getId({xindex})]} class="{cls}" style="{style}">{parent.columnCount} {html}', 
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
                dataField: this.dataField,
				observer: this.observer,
                getData: function(i){
					var data = '';
                    if (this.dataField)
					{												
						if (this.observer)
						{
							data = 'data-date="'+ this.dataField + '"';						
							var hour = this.observer.getHourForCol(i);
							if (hour && hour.length)
								data = 'data-hour="' + hour + '" ' + data;
						}
					}
                    return data;
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
		this.on({
			delay: 100,
			render: function(cmp){
				var hideCmp = cmp.el.down('.hideARow');				
				if (hideCmp)
				{ 
					var parent = cmp;
					hideCmp.mon(hideCmp.el, 'click', function(){
						var baseId = hideCmp.id;
						var mtgsToHide = [];
						for(var i = 3; i <= 39; i++)
						{
							var id = baseId.replace('col-2', Ext.String.format("col-{0}", i));
							var calBlock = cmp.el.down(Ext.String.format('#{0}', id));
							var rect = calBlock.el.dom.getBoundingClientRect();
							var y = (rect.top + rect.bottom) / 2;
							var x = (rect.left + rect.right) / 2;
							var matches = document.elementsFromPoint(x, y);
							
							Ext.each(matches, function(match){
								if (match.classList && match.classList.contains('mtg-instance'))
								{
									if (mtgsToHide.indexOf(match) == -1)
									{
										mtgsToHide.push(match);
										//match.style.display = "none";
										var mtg = cmp.observer.getMeeting(Ext.getCmp(match.id).meetingId, cmp.observer);
										console.dir(mtg);
									}								
								}
							})
						}
						//.moveMeetingUpXRows(mtg.id, shiftAmount, me);
						//console.log(mtgsToHide);
						//cmp.hide();
					})
				}
			},
			scope: this
		})
    }
});