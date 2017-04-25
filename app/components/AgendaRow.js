Ext.ns('AgendaBuilder');

Ext.define('AgendaRow', {
    extend: 'Ext.Component',
    xtype: 'agendarow-ctr',
	cls: 'agendaRowClass',
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
	collapsed: false,
	initComponent: function() {
        this.tpl = new Ext.XTemplate(
			'<table class="rowTable" border="0" cellspacing="0">',
        		'<tpl for="columns">',
		            '<col width="{[this.getColumnWidth(xindex)]} max-width="{[this.getColumnWidth(xindex)]}">',
	        	'</tpl>',
        		'<tr>',
		        	'<tpl for="columns">',
		            	'<td {[this.getData(xindex)]} {[this.getId(xindex)]} class="{cls}" style="{style}">{parent.columnCount} {html}', 
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
							if (i == 39 && !hour)
								hour = "23:59:00";
							if (hour && hour.length)
								data = 'data-hour="' + hour + '" ' + data;
							if (i)
								data = 'data-colIndex="' + i + '" ' + data;
						}
					}
                    return data;
                },
			    getId: function(i){
					return 'id="' + this.id + '-col-' + i + '"';
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
						return Ext.String.format('<img id="agenda-row-hr-{0}" style="margin-right:60px;" data-hasListner=false class="lineThrough" src="app/images/24line.png">', this.id);
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
			afterrender: function(cmp){
				
				var hideShow = function(hCmp, parent, overlayCmp){
						var mtgsToHide = [];
						var date = parent.observer.createDate(parent.dataField.stripInvalidChars());
						var instance = parent.observer.getInstance(date, parent.observer);
						var row = parent.observer.getRow(date);
						row.collapsed = !row.collapsed;
						parent.collapsed = !row.collapsed;
						var topMostCmp = Ext.ComponentQuery.query('#datesCtr')[0];
						var scrollTop = topMostCmp.el.dom.scrollTop;
						//If it hasn't been set, then it is visible
						if (instance.visible === undefined)
							instance.visible = true;
						if (instance.visible)
						{
							hCmp.innerText = '+Show';
							Ext.fly(overlayCmp).setHeight(50);
							Ext.each(instance.meetings, function(mtg){
								var mtgCmp = parent.observer.findMeetingComponent(mtg.id);
								if (mtgCmp && mtgCmp.hide)
									mtgCmp.hide();
							})
							var fstCmp = Ext.getCmp(window.observer.agendaBuilderRows[0].rows[0].id);
							if (fstCmp && fstCmp.el && fstCmp.el.down)
							{
								var twentyFourHourCmp = fstCmp.el.down('.lineThrough');
								if (twentyFourHourCmp && twentyFourHourCmp.hide)
									twentyFourHourCmp.hide();
							}
							for(var i = 1; i < row.rows.length; i++)
							{
								var rowCmp = Ext.getCmp(row.rows[i].id);
								if (rowCmp && rowCmp.hide)
									rowCmp.hide();
							}
							overlayCmp.innerHTML = Ext.String.format("You have <span class='numberCircle room-block'>{0}</span> events on this day. <span class='link-color expand-view'>Expand ></span>", instance.meetings.length);																
						}
						else
						{
							hCmp.innerText = 'Collapse';
							Ext.fly(overlayCmp).setHeight(0);
							Ext.each(instance.meetings, function(mtg){
								var mtgCmp = parent.observer.findMeetingComponent(mtg.id);
								if (mtgCmp && mtgCmp.show)
									mtgCmp.show();
							})
							for(var i = 1; i < row.rows.length; i++)
							{
								var rowCmp = Ext.getCmp(row.rows[i].id);
								if (rowCmp && rowCmp.show)
									rowCmp.show();
							}
							overlayCmp.innerHTML = '';										
						}	

						for (var i = 0; i < parent.observer.agendaBuilderRows.length; i++)
						{
							var f_cmp = Ext.getCmp(parent.observer.agendaBuilderRows[i].rows[0].id);
							if (f_cmp)
							{
								var firstRowIndex = f_cmp.getRowIndex() - 1;
								var d = parent.observer.dates[i];
								Ext.each(d.meetings, function(_m){
									var m_cmp = parent.observer.findMeetingComponent(_m.id);
									var isIndex = m_cmp.getCurrentRow();
									var shouldBeIndex = (firstRowIndex + _m.rowIndex);
									var differential = shouldBeIndex - isIndex;
									if (isIndex > 0 && differential != 0)
									{
											if (differential < 0)
												parent.observer.moveMeetingUpXRows(_m.id, Math.abs(differential), parent.observer);
											else
												parent.observer.moveMeetingDownXRows(_m.id, Math.abs(differential), parent.observer);										
									}								
								})
							}
							
						}
						
						instance.visible = !instance.visible;		
						if (instance.visible)
							parent.observer.setAllRows24HourStatus();
						Ext.each(parent.observer.meetingCallouts, function(callout){
								callout.hide();
						})										
						topMostCmp.el.dom.scrollTop = scrollTop;
				};

				var hideCmp = null;
				var overlayCmp = null;
				var observer = cmp.observer;
				Ext.each(Ext.query('.row-overlay'), function(el){
					if (el && el.dataset && el.dataset.date && observer && observer.areTwoDateStringsEqual(el.dataset.date.stripInvalidChars(), cmp.dataField.stripInvalidChars()))
					{
						overlayCmp = el;
					}
				})	
				Ext.each(Ext.query('.hideARow'), function(el){
					
					if (el && el.dataset && el.dataset.date && observer && observer.areTwoDateStringsEqual(el.dataset.date.stripInvalidChars(), cmp.dataField.stripInvalidChars()))
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
				var onTwentyFourHourClick = function(el){
					if (el)
					{
						var fly = Ext.fly(el);
						if (fly.dom.dataset.haslistner == "false")
						{
							fly.dom.dataset.haslistner = "true"
							el.addEventListener('mousedown', function(event){
								var meetingIds = [];
								if (el.src.indexOf('24line.png') != -1)
								{
									el.src = el.src.replace('24line.png', '24.png');
								}
								else
								{
									el.src = el.src.replace('24.png', '24line.png');
								}	
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
									if (rowEl.classList.contains('oddRowBackGround') ||
										rowEl.classList.contains('oddRowBackGroundB') ||
										rowEl.classList.contains('oddRowBackGroundC'))
									{
										if (rowEl.classList.contains('oddRowBackGround-allday'))
											rowEl.classList.remove('oddRowBackGround-allday');
										else
											rowEl.classList.add('oddRowBackGround-allday');
									}

								}		
								Ext.each(document.elementsFromPoint(event.clientX, event.clientY), function(match){									
									if (match.id.indexOf('agendarow-ctr') != -1 && match.id.indexOf('col') != -1 && match.dataset.date)
									{
										for(var i = 3; i <= 38; i++)
										{
											var curId = match.id.substring(0, match.id.indexOf('col')) + 'col-' + i;
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
								var lineThroughCmp = twentyFourHrCmp.parent().down('.lineThrough');
								if (twentyFourHrCmp.dom.classList.contains('bubbleClicked'))
								{
									//lineThroughCmp.dom.classList.remove('lineHidden');
									twentyFourHrCmp.dom.classList.remove('bubbleClicked');
								}
								else
								{
									//lineThroughCmp.dom.classList.add('lineHidden');
									twentyFourHrCmp.dom.classList.add('bubbleClicked');
								}
								Ext.each(meetingIds, function(mtgId){
									parent.observer.updateMeeting24Hours(mtgId, parent.observer);
								})
								
							});
						}
					}
				};
				Ext.each(Ext.query('.twentyfourhr-bubble'), onTwentyFourHourClick);
				Ext.each(Ext.query('.lineThrough'), onTwentyFourHourClick)
				Ext.each(Ext.query('.twentyfourhour-parent'), onTwentyFourHourClick)
				if (!cmp || !cmp.el ||	!cmp.el.down)
					return;
				var tr = cmp.el.down('tr');
				if (!tr)
					return;	
				Ext.each(tr.el.dom.children, function(tr){
					if (parent && parent.observer)
						parent.observer.addDragOverListener(tr, parent.observer);
				}, parent)
			},
			scope: this
		})
    },
	toggleTwentyFourHour: function(isAllDay, isEmpty, is_meal){
		var me = this;
		var toggleRow = function(rows, clsName){
			Ext.each(rows, function(rowEl){
				if (!isAllDay)
				{
					rowEl.classList.remove(clsName)
				}
				if (isAllDay)
				{
					rowEl.classList.add(clsName);
				}
			})
		}
		toggleRow(me.el.dom.querySelectorAll('.evenRowBackGroundA'), 'evenRowBackGround-allday');
		toggleRow(me.el.dom.querySelectorAll('.evenRowBackGroundB'), 'evenRowBackGround-allday');
		toggleRow(me.el.dom.querySelectorAll('.evenRowBackGroundC'), 'evenRowBackGround-allday');
		toggleRow(me.el.dom.querySelectorAll('.oddRowBackGround'), 'oddRowBackGround-allday');
		toggleRow(me.el.dom.querySelectorAll('.oddRowBackGroundB'), 'oddRowBackGround-allday');
		toggleRow(me.el.dom.querySelectorAll('.oddRowBackGroundC'), 'oddRowBackGround-allday');
		 var twentyFourHrCmp = (Ext.fly(Ext.query('#agenda-row-hr-' + this.id)[0]));
		 if (twentyFourHrCmp)
		 {
			 twentyFourHrCmp.show();
			if (isEmpty == true || is_meal)
			{
				twentyFourHrCmp.hide();
			}
			else if (isAllDay)
			{
				twentyFourHrCmp.dom.src = twentyFourHrCmp.dom.src.replace('24line.png', '24.png');
			}
			else
			{
				twentyFourHrCmp.dom.src = twentyFourHrCmp.dom.src.replace('24.png', '24line.png');
			}
		 }
	},
	getMeetingsCurrentlyOnRow: function(){
		var me = this;
		var rowViewRegion = me.getViewRegion();
		var mtgs = [];
		Ext.each(Ext.query('.mtg-instance'), function(mtg){
			var mtgViewRegion = Ext.getCmp(mtg.id).getViewRegion();
			if (mtgViewRegion.top >= rowViewRegion.top && mtgViewRegion.bottom <= rowViewRegion.bottom)
				mtgs.push(me.observer.getMeeting(Ext.getCmp(mtg.id).meetingId, me.observer));
		})

		return mtgs;
	},
	setAllDayToMatchMeetings: function(){
		var me = this;
		var meetings = me.getMeetingsCurrentlyOnRow();
		var hasAllDayItem = false;
		var hasMeal = false;
		Ext.each(meetings, function(mtg){
			if (mtg && mtg.all_day)
				hasAllDayItem = true;
			if (mtg && mtg.meeting_item_type && mtg.meeting_item_type.is_meal)
				hasMeal = true;
		})
		var isEmpty = !meetings || !meetings.length;
		if (hasMeal)
			hasAllDayItem = false;
		me.toggleTwentyFourHour(hasAllDayItem, isEmpty, hasMeal);
	},
	isFirstRow: function(){
		return this.el.down('.row-overlay') != null;
	},
	isSecondRow: function(){
		return this.el.down('.hideARow') != null;
	},
	getRowIndex: function(){
		var me = this;
		var y = me.getY();
		var centerY = Ext.getCmp(Ext.query('.centerCtr')[0].id).getY();
		var rowOffset = 50;
		var rowPosition = y - centerY;
		return Math.round(rowPosition / rowOffset);
	}
});