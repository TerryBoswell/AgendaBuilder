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
	show24Hr: false,
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
			'{[this.getShow24Hr()]}',
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
				show24Hr: this.show24Hr,
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
				},
				getShow24Hr: function(){
					if (this.show24Hr)
						return '<span data-hasListner=false class="numberCircle bubble-text twentyfourhr-bubble">24</span>';
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
							var hiddenCount = 0;
							for(i = 1; i < row.rows.length; i++)
							{
								var rowCmp = Ext.getCmp(row.rows[i].id);
								rowCmp.hide();
								hiddenCount++;
							}
							for(i = 0; i < parent.observer.dates.length; i++)
							{
								if (parent.observer.dates[i].date > date)
								{
									Ext.each(parent.observer.dates[i].meetings, function(mtg){
										parent.observer.moveMeetingUpXRows(mtg.id, hiddenCount, parent.observer)
									})
								}
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
							var shownCount = 0;
							for(i = 1; i < row.rows.length; i++)
							{
								var rowCmp = Ext.getCmp(row.rows[i].id);
								rowCmp.show();
								shownCount++;
							}
							for(i = 0; i < parent.observer.dates.length; i++)
							{
								if (parent.observer.dates[i].date > date)
								{
									Ext.each(parent.observer.dates[i].meetings, function(mtg){
										parent.observer.moveMeetingDownXRows(mtg.id, shownCount, parent.observer)
									})
								}
							}
							overlayCmp.innerHTML = '';										
						}	
						instance.visible = !instance.visible;		
						Ext.each(parent.observer.meetingCallouts, function(callout){
								callout.hide();
						})										
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
					hideCmp.addEventListener('mousedown', function(tEl){
						hideShow(hideCmp, parent, overlayCmp);
					});
				}
				if (overlayCmp && !overlayCmp.listeningForClick)
				{
					overlayCmp.listeningForClick = true;
					overlayCmp.addEventListener('mousedown', function(tEl){
						if (tEl.target.classList.contains("expand-view"))
							hideShow(hideCmp, parent, overlayCmp);
					});
				}

				Ext.each(Ext.query('.twentyfourhr-bubble'), function(el){
					if (el)
					{
						var fly = Ext.fly(el);
						if (fly.dom.dataset.haslistner == "false")
						{
							fly.dom.dataset.haslistner = "true"
							el.addEventListener('mousedown', function(event){
								var meetingIds = [];	
								var toggle24Hour = function(rowEl)
								{
									if (rowEl.classList.contains('evenRowBackGroundA') ||
										rowEl.classList.contains('evenRowBackGroundB') ||
										rowEl.classList.contains('evenRowBackGroundC'))
									{
										if (rowEl.classList.contains('evenRowBackGround-allday'))
											rowEl.classList.remove('evenRowBackGround-allday');
										else
											rowEl.classList.add('evenRowBackGround-allday');
									}
								}										
								Ext.each(document.elementsFromPoint(event.clientX, event.clientY), function(match){									
									if (match.id.indexOf('agendarow-ctr') != -1 && match.id.indexOf('col') != -1 && match.dataset.date)
									{
										for(var i = 3; i <= 39; i++)
										{
											var curId = match.id.substring(0, match.id.indexOf('col')) + 'col-' + i;
											//evenRowBackGround-allday
											var rowEl = document.getElementById(curId);
											toggle24Hour(rowEl);
											var rect = rowEl.getBoundingClientRect();
											var y = (rect.top + rect.bottom) / 2; //We'll get the center
											var x = (rect.left + rect.right) / 2;
											Ext.each(document.elementsFromPoint(x, y), function(subMatch){
												if (subMatch.classList.contains('mtg-instance'))
												{
													var mtgId = Ext.getCmp(subMatch.id).meetingId;
													if (!meetingIds.includes(mtgId))
														meetingIds.push(mtgId);													
												}
											})											
										}
									}
								})
								var twentyFourHrCmp = (Ext.fly(el));
								if (twentyFourHrCmp.dom.classList.contains('bubbleClicked'))
									twentyFourHrCmp.dom.classList.remove('bubbleClicked');
								else
									twentyFourHrCmp.dom.classList.add('bubbleClicked');
								Ext.each(meetingIds, function(mtgId){
									parent.observer.updateMeeting24Hours(mtgId, parent.observer);
								})
								
							});
						}
					}
				})

			},
			scope: this
		})
    }
});