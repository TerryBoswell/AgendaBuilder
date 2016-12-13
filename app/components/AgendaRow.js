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
	insertOverLay: false,
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
				' {[this.getHasOverLay()]}',
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
				insertOverLay: this.insertOverLay,
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
                },
				getHasOverLay: function(){
					if (this.insertOverLay)
					{
						var data = '';
						if (this.dataField)
						{												
							data = 'data-date="'+ this.dataField + '"';						
						}
						return Ext.String.format('<div {0} class="row-overlay"></div>', data);
					}

					return '';
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
				
				var hideShow = function(hCmp, parent, overlayCmp){
						var mtgsToHide = [];
						var date = new Date(parent.dataField);
						var instance = parent.observer.getInstance(date, parent.observer);
						var row = parent.observer.getRow(date)
						//If it hasn't been set, then it is visible
						if (instance.visible === undefined)
							instance.visible = true;
						if (instance.visible)
						{
							hCmp.innerText = '+Show';
							Ext.each(instance.meetings, function(mtg){
								var mtgCmp = parent.observer.findMeetingComponent(mtg.id);
								mtgCmp.hide();
							})
							for(i = 1; i < row.rows.length; i++)
							{
								var rowCmp = Ext.getCmp(row.rows[i].id);
								rowCmp.hide();
							}
							overlayCmp.innerHTML = Ext.String.format("You have <span class='numberCircle bubble-text'>{0}</span> events on this day. <span class='link-color expand-view'>Expand view ></span>", instance.meetings.length);																
						}
						else
						{
							hCmp.innerText = '-Hide';
							Ext.each(instance.meetings, function(mtg){
								var mtgCmp = parent.observer.findMeetingComponent(mtg.id);
								mtgCmp.show();
							})
							for(i = 1; i < row.rows.length; i++)
							{
								var rowCmp = Ext.getCmp(row.rows[i].id);
								rowCmp.show();
							}
							overlayCmp.innerHTML = '';										
						}	
						instance.visible = !instance.visible;						
						
						//.moveMeetingUpXRows(mtg.id, shiftAmount, me);						
				};

				var hideCmp = null;
				var overlayCmp = null;
				Ext.each(Ext.query('.row-overlay'), function(el){
					if (el && el.dataset && el.dataset.date && el.dataset.date == cmp.dataField)
					{
						overlayCmp = el;
					}
				})	
				Ext.each(Ext.query('.hideARow'), function(el){
					if (el && el.dataset && el.dataset.date && el.dataset.date == cmp.dataField)
					{
						hideCmp = el;
					}
				})	
				var parent = cmp;								
				if (hideCmp && !hideCmp.listeningForClick)
				{ 					
					hideCmp.listeningForClick = true;
					hideCmp.addEventListener('mousedown', function(){
						hideShow(hideCmp, parent, overlayCmp);
					});
				}
				if (overlayCmp && !overlayCmp.listeningForClick)
				{
					overlayCmp.listeningForClick = true;
					overlayCmp.addEventListener('mousedown', function(){
						hideShow(hideCmp, parent, overlayCmp);
					});
				}

			},
			scope: this
		})
    }
});