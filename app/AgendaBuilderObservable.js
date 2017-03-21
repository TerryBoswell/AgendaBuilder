Ext.ns('AgendaBuilder');

Ext.define('AgendaBuilderObservable', {
    version: '1.016',
    extend: 'Ext.mixin.Observable',
    agendaBuilderRows: [], //This holds the agenda builder rows added for each date
    // The constructor of Ext.util.Observable instances processes the config object by
    // calling Ext.apply(this, config); instead of this.initConfig(config);
    $applyConfigs: true,
    rfpNumber: null,
    agendaMode: null,
    meeting_item_types: null,
    room_setups: null,
    dates: null,
    totalRowCount: 0,
    meetingCallouts: [],
    dividerRows: [],
    queuedDates: [],
    localListeners: [],
    ajaxController: null,
    currentDragMtg: null, //This is used to target when item is current being dragged
    currentDragDrop: null, //This is the current drag drop manager
    isInitialized: false, //flag to keep from repeating after initialize
    lastRecordedY: 0,
    initAjaxController: function(url, scope){
        var me = scope;
        me.ajaxController = Ext.create('AjaxController', {
            rfpNumber: me.rfpNumber,
            ajaxUrlBase: url
        })
    },
    clearAllCmps: function(){
        Ext.ComponentQuery.query('#datesCtr')[0].removeAll(true);
        Ext.each(Ext.query('.mtg-instance'), function(mtg){Ext.fly(mtg).destroy()});
        Ext.ComponentQuery.query("#northCtrMeal")[0].removeAll();
        Ext.ComponentQuery.query("#northCtrMtg")[0].removeAll();
        Ext.each(this.meetingCallouts, function(callout){
            callout.hide();
        })
    },
    mask: function(showMask)
    {
        var datesCtr = Ext.ComponentQuery.query('#MainContainer')[0];
        datesCtr.mask();
        Ext.each(Ext.query('.mtg-instance'), function(cmp){
            Ext.getCmp(cmp.id).disable();
        })        
    },
    unmask: function(){
        var datesCtr = Ext.ComponentQuery.query('#MainContainer')[0];
        
        datesCtr.unmask();
        Ext.each(Ext.query('.mtg-instance'), function(cmp){
            Ext.getCmp(cmp.id).enable();
        })
        
    },
    showError: function(msg){
        var hasErrorNotification = false;
        try
        {
            hasErrorNotification = errorNotification !== undefined && Ext.isFunction(errorNotification);
        }
        catch(e){
            hasErrorNotification = false;
        }

        if (hasErrorNotification)
        {
            errorNotification(msg);
        }
        else
        {
            var toast = new Ext.toast({
                            width: 400, 
                            align: 'bl', 
                            style: 'border-radius: 5px; border-style: none;border-width: 0px; background-color: #BC4A46;', 
                            bodyStyle: 'background-color: #BC4A46;', 
                            border: false, 
                            bodyBorder: false, 
                            layout: {
                                type: 'hbox',
                                align:'stretch'
                            },
                            items: [
                                {
                                    xtype: 'box',
                                    html: '<div>' + msg + '</div>',
                                    cls: 'error-toast',
                                    flex: 1
                                },
                                {
                                    xtype: 'box',
                                    html: '<i style="float:right;" class="fa fa-times fa-2x error-close" aria-hidden="true"></i>',
                                    cls: 'error-toast',
                                    width: 50
                                }
                            ],
                            autoCloseDelay: 10000,
                            listeners: {
                                delay:100,
                                afterrender: function(el){
                                    var cmp = Ext.query('.error-close')[0];
                                    cmp.addEventListener('click', function(){
                                            toast.hide();
                                    });
                                }
                            }
                        });
        }
    },
    areTwoDateStringsEqual: function(str1, str2)
    {
        var me = this;
        if (!str1 || !str2)
            return false;
        var date1 = me.createDate(str1);
        var date2 = me.createDate(str2);
        return this.areTwoDatesEqual(date1, date2);
    },
    areTwoDatesEqual: function(date1, date2)
    {
        if (!date1 || !date2 || !date1.getDate || !date2.getDate)
            return false;
        return date1.getDate() == date2.getDate() && date1.getMonth() == date2.getMonth();
    },
    parseDateStringToUTC: function(str){
        if (!str || !str.slice)
            return null;
        var dateStr = str.slice(0,10);
        var segments = dateStr.split("/");
        var year = segments[0] * 1;
        var month = (segments[1] * 1) - 1;
        var day = (segments[2] * 1);
        return new Date(Date.UTC(year, month, day));
    },
    createDateWithTime: function(date, time){
        if (Ext.isFirefox)
         {
            var dateStr = Ext.Date.format(date, 'Y-m-d') + " " + time;   
            
            return new Date(dateStr);
         }
         var dateAndTime = date.toString().replace('00:00:00', time);
         return new Date(dateAndTime);
    },
    createDate: function(str){
         if (Ext.isFirefox)
         {
             if (!str || !str.length)
             {
                 return null;
             }
             str = str.substr(0, 10);
             var segments = [];
             if (str.indexOf("/") != -1)
                segments = str.split("/");
             else if (str.indexOf("-") != -1)
                segments = str.split("-");
             else
                throw("Unknown date format");

            var year = "";
            var month = "";
            var date = "";
             if (segments.length < 3)
                throw("Unknown date format");
             //year is first
             if (segments[0].length == 4)
             {
                 year = segments[0];
                 month = segments[1];
                 date = segments[2];
             }
             else
             {
                 year = segments[2];
                 month = segments[0];
                 date = segments[1];
             }
             if (month.length == 1)
                month = "0" + month;
             if (date.length == 1)
                date = "0" + date;
            
            return new Date(year + '-' + month + '-' + date);
         }
         return new Date(str);
    },
    isAfterHour: function(timeStr, hour){        
        return this.getHourFromTime(timeStr) > hour;
    },
    isBeforeHour: function(timeStr, hour){
        return this.getHourFromTime(timeStr) < hour;
    },
    getHourFromTime: function(timeStr){
        var me = this;
        if (!timeStr)
            throw "Invalid time";
        if (timeStr == "00:00" || timeStr == "23:59") 
            return 24;
        if (timeStr == "00:00:00" || timeStr == "23:59:00")
            return 24;
        var date = new Date(Ext.String.format("1/1/2016 {0}", timeStr));
        return date.getHours();        
    },
    getHourForCol: function(col){
        var colBase = 3;
        if (col < colBase)
            return '';     
        if (col > 38)
            return '';
        var minutes = (col - colBase) * 30;
        var newDate = new Date();
        var d = Ext.Date.add(new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 6,0,0) , Ext.Date.MINUTE, minutes);

        return  Ext.Date.format(d, 'H:i:s');
    },
    recordCurrentY: function(){
        var me = this;
        me.lastRecordedY = window.pageYOffset;
    },
    restoreLastY: function(){
        var me = this;
        window.scrollTo(0, me.lastRecordedY);        
    },
    createMeetingTemplateComponent: function(m){
            var t = new Ext.Template(
                        '<div>',
                            '<img class="grabBars" src="app/images/grabbars.png">',
                            '<span class="grabTitle">{title}</span>',
                        '</div>',
                        // a configuration object:
                        {
                            compiled: true,      // <a href='#method-compile'>compile</a> immediately
                        }
            );
            var style = 'margin: 3px; border-radius: 5px; background-color: #' + m.color + '; color: white;'
            var width = (m.title.length * 6) + 50;
            var t = Ext.create('MeetingTemplate', 
            {
                html: t.apply(m),
                style:  style,
                width: width,
                observer: this,
                meeting: m,
                template: t,
                itemId: "meetingItemTemplate" + m.id
            });
            return t;
    },
    buildMeetings : function(meeting_item_types){
        var me = this;
        Ext.each(meeting_item_types, function(m){
            var ctrId = "#northCtrMeal";
            if (!m.is_meal)
                ctrId = "#northCtrMtg";
            Ext.ComponentQuery.query(ctrId)[0].add(me.createMeetingTemplateComponent(m));
 
        })
    },
    getDayOfTheWeek: function(d)
    {
        var weekday = new Array(7);
        weekday[0]=  "Sun";
        weekday[1] = "Mon";
        weekday[2] = "Tue";
        weekday[3] = "Wed";
        weekday[4] = "Thu";
        weekday[5] = "Fri";
        weekday[6] = "Sat";

        return weekday[d.getDay()];
    },
    buildDates: function(dates){
        this.dates = dates;
        var datesCtr = Ext.ComponentQuery.query('#datesCtr')[0];
        var me = this;
        Ext.each(dates, function(instance){
            me.buildSingleDate(instance, datesCtr);
            me.buildMeetingsForDate(instance, me);
        }); 
        this.setAllRows24HourStatus(); 
        this.setAllRowCommentStatus();      
    },
    getDates: function(){
        return this.dates;
    },
    buildMeetingsForDate: function(instance, context){
        var me = context;
        Ext.each(instance.meetings, function(meeting){
                var start = meeting.start_time.replace('1900/01/01 ', '');
                var end = meeting.end_time.replace('1900/01/01 ', '');
                var color = "#" + meeting.meeting_item_type.color;
                var rowIdx = me.calculateRowIndex(meeting, instance);
                me.createMeeting(meeting.id, instance.date, start, end, meeting.title, 'white', 
                    color, rowIdx, me, meeting.meeting_item_type);
            });
    },
    assignRowIndexes: function(instance){
        var me = this;
        var date = instance.date;
        if (Object.prototype.toString.call(date) != '[object Date]')
            date = me.createDate(instance.date)
        var dateStr = Ext.Date.format(date, "m/d/Y");
        var offset = Ext.Date.format(date, 'P');
        var zone = Ext.Date.format(date, 'T');
        if (offset.indexOf("+") != -1)
            zone = "GMT";
        
        var formatDate = function(date_time, dateStr, zone, offset)
        {
            if (Ext.isIE)
            {
                var theDateStr = date_time.replace('1900/01/01', dateStr.stripInvalidChars());
                offset = offset.replace(":", "");
                return new Date(Ext.String.format("{0}{1}", theDateStr, offset))
            }
            else if (Ext.isFirefox)
            {
                var theDateStr = date_time.replace('1900/01/01', dateStr.stripInvalidChars());
                offset = offset.replace(":", "");
                return new Date(theDateStr);
            }
            else
            {
                var theDateStr = date_time.replace('1900/01/01', dateStr.stripInvalidChars());
                return new Date(theDateStr + ' ' + zone + offset);
            }
        }
        Ext.each(instance.meetings, function(m){
            m.start = formatDate(m.start_time, dateStr, zone, offset); // new Date(m.start_time.replace('1900/01/01', dateStr.stripInvalidChars()) + ' ' + zone + offset);
            m.end = formatDate(m.end_time, dateStr, zone, offset);
        })
       /*********************************/

        //Sort them all into order to start with
        var sortFn = function(itemA, itemB){
            return itemA.start.getTime() - itemB.start.getTime();
        }

        var dataOrderedData = instance.meetings.sort(sortFn);
        var dict = {};

        Ext.each(dataOrderedData, function(d){
            var key = d.meeting_item_type.color;
            if (dict[key] == undefined)
                dict[key] = [];
            dict[key].push(d)
        })

        //Now lets order the types by there first instance start
        var colorOrder = [];
        for (var property in dict) {
            var v = dict[property][0];
            colorOrder.push({color : v.meeting_item_type.color, start : v.start})
        }
        colorOrder = colorOrder.sort(sortFn);

        var colorOrderDictionary = {};

        var i = 1;
        Ext.each(colorOrder, function(c){
            colorOrderDictionary[c.color] = i;
        i++;
        })

        Ext.each(dataOrderedData, function(d){
            d.oldRowIndex = d.rowIndex;
            d.rowIndex = colorOrderDictionary[d.meeting_item_type.color];
        })
        //This function will be used to detect record overlaps
        var overLapsSamePreviousType = function(idx, data)
        {
            if (idx === 0)
                return false;
            if (idx >= data.length)
                return false;
            if (data[idx].meeting_item_type.color != data[idx - 1].meeting_item_type.color)
                return false;
            if (data[idx].meeting_item_type.color == data[idx - 1].meeting_item_type.color &&
                 data[idx - 1].all_day)
                 return true;
            return data[idx].start < data[idx - 1].end;
        }

        //we'll order by column index now
        var rowOrderedData = dataOrderedData.sort(function(itemA, itemB){
            if (itemA.rowIndex == itemB.rowIndex)
            {
                return itemA.start.getTime() - itemB.start.getTime();
            }
            return itemA.rowIndex - itemB.rowIndex;
        })

        instance.meetings = rowOrderedData;
        var recordOverlaps = 0;
        var maxRows = 0;
        //now we will bump any records with record overlaps
        for(var i = 0; i < instance.meetings.length; i++)
        {
            if (overLapsSamePreviousType(i, instance.meetings))
            {
                recordOverlaps++;
            }
            instance.meetings[i].rowIndex += recordOverlaps;
            maxRows = instance.meetings[i].rowIndex;
            
        }
        /*********************************/
        return maxRows;
    },
    calculateRowIndex: function(meeting, instance){
        return meeting.rowIndex - 1;
    },
    setAgendaMode: function(mode){
        if (mode == agendaMode.Hotel || mode == agendaMode.Planner)
        {
            this.agendaMode = mode;
        }
        else
        {
            throw("Agenda Mode is not valid (Hotel or Planner)");
        }
    },
    getAgendaMode: function(){
        return this.agendaMode;
    },
    addPreDays: function(count){
        var me = this;
        me.savePrePostDays('pre', count, me);
        Ext.ComponentQuery.query('#datesCtr')[0].removeAll();
        me.removeAllMeetings();
        var firstDate = me.dates[0].date;
        var newRows = [];
        for(var i = 1; i <= count; i++)
        {
            newRows.push({
                date : Ext.Date.add(firstDate, Ext.Date.DAY, -i),
                meetings: [],
                room_block: 0,
                room_night: firstDate.room_night - i
            })
        }
        Ext.each(me.dates, function(d){
            newRows.push(d);
        })
        var sortFn = function(itemA, itemB){
            return itemA.date - itemB.date;
        }

        me.agendaBuilderRows = [];
        me.dates = [];
        me.buildDates(newRows.sort(sortFn));
    },
    addPostDays: function(count){
        var me = this;
        me.savePrePostDays('post', count, me);
        Ext.ComponentQuery.query('#datesCtr')[0].removeAll();
        me.removeAllMeetings();        
        var lastDate = me.dates[me.dates.length - 1].date;
        var newRows = [];
        Ext.each(me.dates, function(d){
            newRows.push(d);
        })
        for(var i = 1; i <= count; i++)
        {
            newRows.push({
                date : Ext.Date.add(lastDate, Ext.Date.DAY, i),
                meetings: [],
                room_block: 0,
                room_night: lastDate.room_night + i
            })
        }
        me.agendaBuilderRows = [];
        me.dates = [];
        me.buildDates(newRows);
    },
    buildSingleDate: function(instance, parentCtr){
            var me = this;
            var day = me.getDayOfTheWeek(instance.date);
            var agendaBuilderRow = {
                rows : [],
                date: instance.date,
                meetings: [],
                rowCount: null,
                rowIndex: me.agendaBuilderRows.length                
            };
            var data = instance.date.toLocaleDateString();
            //This methods assigns the row index to the meetings and returns the number
            //of rows we need
            agendaBuilderRow.rowCount = me.assignRowIndexes(instance);
            if (agendaBuilderRow.rowCount < 2)
                agendaBuilderRow.rowCount = 2; //We always need a minimum of 2 rows
            var topRow = Ext.create('AgendaRow', 
                {
                    height: 50,
                    evenColClass : 'evenRowBackGroundA',
                    oddColClass: 'oddRowBackGround',
                    dataField: data,
                    observer: this,
                    insertOverLay: true,
                    columns: [
                        {html: day + '</br> ' + (instance.date.getMonth() + 1) + '/' + instance.date.getDate(), 
                            style: 'font-size:medium; text-align: center;', Index: 0, cls: ''},
                        {html: '<span class="room-block" style="text-align:center; padding: 5px 8px; border-radius: 3px;">' + instance.room_block + 
                            '</span>', style: '', Index: 1, cls: ''},
                        {html: '', style : 'background-color:grey !important;', Index: 38  }
                        ]
                });
            parentCtr.add(topRow);
            var bottomRow = Ext.create('AgendaRow', 
                {
                    height: 50,
                    evenColClass : 'evenRowBackGroundB',
                    oddColClass: 'oddRowBackGroundC',
                    dataField: data,
                    observer: this,
                    show24Hr: true,
                    columns: [
                        //{cls: '', Index: 0},
                        {html: 'Collapse', cls: 'hideARow link-color ltFont', style : 'text-align: center !important;height: 42px; float:left !important; padding-left:3px;', Index: 0},
                        {html: '', style: '', cls: '', Index: 1},
                        {html: '', style : 'background-color:grey !important;', Index: 38  }
                        ]
                });
            parentCtr.add(bottomRow);
            

            agendaBuilderRow.rows.push({id: topRow.id});
            agendaBuilderRow.rows.push({id: bottomRow.id});
            this.agendaBuilderRows.push(agendaBuilderRow);
            for(var j = 2; j < agendaBuilderRow.rowCount; j++)
            {
                me.addAdditionalRow(instance.date, me, agendaBuilderRow);
            }

            var dvdr = Ext.create('AgendaRow', 
                {
                    height: 1,
                    date: me.createDate(data),
                    isDividerRow: true,
                    defaultColClass: 'rowDivider'//,
                    //defaultColStyle:'border-bottom: 1px solid black !important;'
                });
            parentCtr.add(dvdr);
            me.dividerRows.push(dvdr);
    },
    removeAllMeetings: function(){
        Ext.each(Ext.query('.mtg-instance'), function(el){
            Ext.fly(el).destroy()
        })
    },
    getDividerRowIndex: function(date){
        var me = this;
        var index = null;  
        var items = Ext.ComponentQuery.query('#datesCtr')[0].items.items;
        for(var z = 0; z < items.length; z++)
        {
            var item = items[z];
            if (me.areTwoDatesEqual(item.date, date) && item.isDividerRow)
                index = z;
        };
        
        return index;
    },
    addAdditionalRow: function(date, context, agendaBuilderRow, insertRowAt){
        if (context)
            var me = context;
        else
            var me = this;
        //The insert point is always one less than the row index ie... insert at 9 needs to check the row with the index of 8 (0-8)
        //we can't insert in the first two rows. They are reserved
        var currRow = me.getRowAt(insertRowAt);
        if (currRow != null && currRow.isFirstRow())
        {
            var rowDate = me.createDate(currRow.dataField);
            if (me.areTwoDatesEqual(rowDate, date))
            {
                insertRowAt++;
                currRow = me.getRowAt(insertRowAt);                
            }
        }
        if (currRow != null && currRow.isSecondRow())
        {
            var rowDate = me.createDate(currRow.dataField);
            if (me.areTwoDatesEqual(rowDate, date))
            {
                insertRowAt++;
            }            
        }
        var dividerRowIndex =  me.getDividerRowIndex(date);
        if (dividerRowIndex && dividerRowIndex < insertRowAt)
            insertRowAt = dividerRowIndex;
        if (!agendaBuilderRow)
            agendaBuilderRow = me.getRow(date);
        var data = date.toLocaleDateString();
        function isOdd(num) { return ((num % 2) == 1);}
        var evenColClass = 'evenRowBackGroundC';
        var oddColClass = 'oddRowBackGroundB';
        var datesCtr = Ext.ComponentQuery.query('#datesCtr')[0];
        var row = Ext.create('AgendaRow', 
                {
                    height: 50,
                    evenColClass : evenColClass,
                    oddColClass: oddColClass,
                    dataField: data,
                    observer: this,
                    show24Hr: true,
                    columns: [
                        {cls: '', Index: 0},
                        {html: '', cls: 'link-color', style : 'text-align: center;height: 42px;', Index: 1}, //{html: '-Collapse', cls: '', style : 'text-align: center;height: 42px;', Index: 1}
                        {html: '', style : 'background-color:grey !important;', Index: 38  }
                        ]
                });
        if (insertRowAt == null || insertRowAt == undefined)
            datesCtr.add(row);
        else
        {
            datesCtr.insert(insertRowAt, row);
        }
        agendaBuilderRow.rows.push({id: row.id})
        return row;
    },
    buildHourColumns: function(cnt){
        var cols = [];
        for(var i = 0; i < cnt; i++)
        {
            cols.push({html: '', style: ''});
        }
        return cols;
    },
    getDimensions: function(rowIdx, date, startHour, endHour){
        var me = this;
        var agendaBuilderRow = me.getRow(date);
        //temp to get the first row
        if (rowIdx == undefined || rowIdx == null)
            rowIdx = 0;
        var row = agendaBuilderRow.rows[rowIdx];
        var startColId = me.getColForHour(startHour);
        if (!row)
            return null;
        var startHourId = row.id + "-col-" + startColId;
        var sfly = Ext.fly(document.getElementById(startHourId));
        var xy = sfly.getXY();
        var height = sfly.getHeight();

        var endColId = me.getColForHour(endHour);
        var endHourId = row.id + "-col-" + endColId;
        var efly = Ext.fly(document.getElementById(endHourId));
        if (!efly)
        {
            return null;
        }
        var width = Math.abs(xy[0] - efly.getXY()[0]);
        return {
            height: height,
            width: width,
            xy: xy
        }
    },
    getDimensionsByRowIndex: function(rowIdx, startHour, endHour){
        var me = this;
        var row = me.getRowAt(rowIdx);
        var startColId = me.getColForHour(startHour);
        if (!row)
            return null;
        var startHourId = row.id + "-col-" + startColId;
        var sfly = Ext.fly(document.getElementById(startHourId));
        var xy = sfly.getXY();
        var height = sfly.getHeight();

        var endColId = me.getColForHour(endHour);
        var endHourId = row.id + "-col-" + endColId;
        var efly = Ext.fly(document.getElementById(endHourId));
        if (!efly)
        {
            return null;
        }
        var width = Math.abs(xy[0] - efly.getXY()[0]);
        return {
            height: height,
            width: width,
            xy: xy
        }
    },
    addDragOverListener: function(el, observer){
        var event = 'mousemove';
        if (Ext.isIE)
            event = 'pointermove';
        el.addEventListener(event, function(mouseEvent){
            var currentDragMtg = null;
            if (observer && observer.currentDragMtg)
                currentDragMtg = observer.currentDragMtg;
            else
                return;
            observer.handleMeetingDrag(mouseEvent, currentDragMtg, observer);
        });
    },
    handleMeetingDrag: function(mouseEvent, meeting, scope){
        var me = scope;
        var rect = meeting.el.dom.getBoundingClientRect();
        var y = (rect.top + rect.bottom) / 2; //We'll get the center
        var getColIndex = function(el)
        {
            if (!el || !el.dataset || !el.dataset.colindex)
                return null;
            return el.dataset.colindex * 1;
        }

        var getHour = function(el){
            if (!el || !el.dataset || !el.dataset.hour)
                return null;
            return el.dataset.hour;
        
        };
        //Now let's  find the starting timeslot
        var startingCol = null;
        var startingLeft = null;
        var startingHour = null;
        var endingCol = null;
        var endingRight = null;
        var endingHour = null;
        var startingPoint = rect.left + 1; //shifted one pixel to make sure we are on the starting block    
        var elements = document.elementFromPoint(startingPoint, y);
        Ext.each(document.elementsFromPoint(startingPoint, y), function(el){
            if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
            {
                startingCol = getColIndex(el);
                var startingRect = el.getBoundingClientRect();
                startingHour = getHour(el);
                startingLeft = startingRect.left;
            }
        })
        if (startingCol < 3)
        {
            Ext.each(Ext.query('td'), function(dtel){dtel.classList.remove('shaded');});
            me.hideDragDropHourPreview();
            return;
        }
        var endingPoint = rect.right;// - 1; //shifted one pixel to make sure we are on the ending point
        Ext.each(document.elementsFromPoint(endingPoint, y), function(el){
            if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
            {
                var endRect = el.getBoundingClientRect();
                endingCol = getColIndex(el);
                endingRight = endRect.right;
                endingHour = getHour(el);
            }
        })
        endingCol -= 1;
        
        if (endingCol > 38)
        {
            Ext.each(Ext.query('td'), function(dtel){dtel.classList.remove('shaded');});
            me.hideDragDropHourPreview();
            return;
        }
        var elementsToUpdate = [];
        Ext.each(Ext.query('td'), function(dtel){
            var colIndex = getColIndex(dtel);
            var dtRect = dtel.getBoundingClientRect();

            /**
             * Left of Column < right of cmp
                and
                right of column > right of cmp
                */
            var isOverLapLastRow = dtRect.left < endingRight && dtRect.right > endingRight;
            if (colIndex >= startingCol && colIndex <= endingCol &&
                !isOverLapLastRow)
            {
                dtel.classList.add('shaded');
            }
            else
                dtel.classList.remove('shaded');
        })
        if (startingHour && endingHour && endingRight)
            me.showDragDropHourPreview(endingRight - 50, mouseEvent.pageY + 40, 
                me.convertTimeTo12Hrs(startingHour),me.convertTimeTo12Hrs(endingHour), me)
    },
    getUnAccountAttendees: function(date, context){
        if (context)
            var me = context;
        else
            var me = this;
        var instance = observer.getInstance(date, me);
        var mtgTotal = instance.room_block;
        
        if (!instance || !instance.meetings || !instance.meetings.length)
            return mtgTotal;
        Ext.each(instance.meetings, function(mtg){
            mtgTotal -= mtg.num_people;
        })
        if (mtgTotal < 0)
            return 0;
        return mtgTotal;
    },
    createMeeting: function(id, date, startHour, endHour, text, fontColor, color, rowIdx, context, MeetingTemplate, renderCallBack){
        if (context)
            var me = context;
        else
            var me = this;
        var m = {
            booths: 0,
            start_time: startHour,
            tabletops: 0,
            square_feet: 0,
            posters: 0,
            id: null,
            title: text,
            all_day: MeetingTemplate.all_day,
            note: "",
            room_setup: MeetingTemplate.default_room_setup_id,
            room_setup_type : me.getRoomSetup(MeetingTemplate.default_room_setup_id),
            end_time: endHour,
            num_people: 0,
            meeting_item_type: me.getMeetingType(MeetingTemplate.id),
            type: MeetingTemplate.id,
            date: date,
            rowIndex: rowIdx
        };
        
        var dimensions = me.getDimensions(rowIdx, date, startHour, endHour);
        if (!dimensions)
            return;
        var height = dimensions.height;
        var width = dimensions.width;
        var xy = dimensions.xy;
        var datesCtr = Ext.ComponentQuery.query('#datesCtr')[0];
        var datesCtrXY = datesCtr.getXY();
        
        var createTip = function(target, renderTo, meetingId, observer, color, fontColor, title) {
            var position = target.el.dom.getBoundingClientRect();
            var centerX = position.left + position.width / 2;
            var centerY = position.top + position.height / 2;
            var mtg = observer.getMeeting(meetingId, observer);
            if (!mtg)
                mtg = m;
            return target.extender = Ext.create('Ext.Component', {
                html: '<div class="meetingTip"></div>',
                style: 'background: rgba(1, 0, 0, 0);padding-top: 12px;',
                cls: 'mtg-tip-ctr',
                target: target,
                floating: true,
                renderTo: renderTo.el,
                parent: renderTo,
                hidden: true,
                observer: observer,
                meetingId: meetingId,
                titleColor: color,
                titleFontColor: fontColor,
                titleText : title,
                layout: {
                  type : 'vbox',
                  align: 'stretch'
                },
                items: [
                  {
                    xtype: 'container',
                    height: 10,
                    style: 'border: 1px solid'
                  }
                ],
                listeners: {
                    afterrender: function(tEl) {
                        tEl.container = Ext.create('Ext.Container', {
                            renderTo: tEl.el.down('.meetingTip').el,
                            style: 'padding: 1px 1px;',
                            height: 125,
                            width: 230,
                            layout: {
                                type: 'vbox'
                            },
                            defaults: {
                                width: 222
                            },
                            items: [
                                {
                                    xtype: 'container',
                                    meetingId: meetingId,
                                    observer: tEl.observer,
                                    html: tEl.observer.getMeetingHtml(tEl.titleText, tEl.meetingId),
                                    height: 25,
                                    style: {
                                        color: tEl.titleFontColor,
                                        backgroundColor: tEl.titleColor
                                    },
                                    cls: 'callout-title',
                                    listeners: {
                                                delay: 10,
                                                scope: this,
                                                afterrender: function(targetCmp) {
                                                    targetCmp.observer.subScribeOnMtgClick(targetCmp.meetingId, targetCmp.observer);
                                                }
                                    } 
                                },
                                {
                                    xtype: 'container',
                                    flex: 1, 
                                    style: 'padding: 10px;',
                                    cls: 'thinBorderBottom',
                                    html : '<div class="callout-time" style="text-align:center;">' + observer.getDisplayHours(mtg.start) + " - " + observer.getDisplayHours(mtg.end)  + "<div>" + 
                                            '<div class="callout-room" style="text-align:center;">' + mtg.room_setup_type.title + " | " + mtg.num_people +"pp</div>"
                                },
                                {
                                    xtype: 'container',
                                    height: 40,
                                    layout: {
                                        type: 'hbox'
                                    },
                                    defaultType: 'container',
                                    defaults: {
                                        height: 30,
                                        style: 'text-align: center; font-size: larger; padding-bottom: 5px;'
                                    },
                                    padding: 5,
                                    items: [
                                        {
                                            flex: 1
                                        },
                                        {
                                            html: 'Copy',                                            
                                            width: 70,
                                            observer: observer,
                                            cls: 'tipshortcut',
                                            meetingId: meetingId,
                                            listeners: {
                                                delay: 1000,
                                                scope: this,
                                                afterrender: function(targetCmp) {
                                                    targetCmp.mon(targetCmp.el, 'click', function(){
                                                        var mtg = targetCmp.observer.getMeeting(targetCmp.meetingId, targetCmp.observer);
                                                        mtg.date = targetCmp.observer.getDate(targetCmp.meetingId, targetCmp.observer);
                                                        Ext.each(targetCmp.observer.meetingCallouts, function(callout){
                                                            callout.hide();
                                                        })
                                                        var start = mtg.start_time.replace('1900/01/01 ', '');
                                                        var end = mtg.end_time.replace('1900/01/01 ', '');
                                                        var color = "#" + mtg.meeting_item_type.color;
                                                        var copyMtg = targetCmp.observer.createMeeting(0, mtg.date, start, end, mtg.title, 'white', 
                                                            color, 0, targetCmp.observer, mtg.meeting_item_type, function(_m){
                                                               new Ext.util.DelayedTask(function(){
                                                                    _m.num_people = mtg.num_people;
                                                                    _m.room_setup = mtg.room_setup;
                                                                    _m.room_setup_type = mtg.room_setup_type;
                                                                    _m.booths = mtg.booths;
                                                                    _m.all_day = mtg.all_day;
                                                                    _m.posters = mtg.posters;
                                                                    _m.square_feet = mtg.square_feet;
                                                                    _m.tabletops = mtg.tabletops;
                                                                    targetCmp.observer.saveMeetingItem(_m);
                                                                }, this).delay(100); 
                                                                
                                                            }); 
                                                        
                                                    })
                                                }
                                            }
                                        },
                                        {
                                            html: 'Edit',
                                            cls: 'thinBorder tipshortcut',
                                            width: 70,
                                            observer: observer,
                                            meetingId: meetingId,
                                            listeners: {
                                                delay: 1000,
                                                scope: this,
                                                afterrender: function(targetCmp) {
                                                    targetCmp.mon(targetCmp.el, 'click', function(){
                                                        var mtg = targetCmp.observer.getMeeting(targetCmp.meetingId, targetCmp.observer);
                                                        mtg.date = targetCmp.observer.getDate(targetCmp.meetingId, targetCmp.observer);
                                                        Ext.each(targetCmp.observer.meetingCallouts, function(callout){
                                                            callout.hide();
                                                        })
                                                        targetCmp.observer.showMeetingEditor(mtg, targetCmp.observer, mtg.meeting_item_type, mtg.date, targetCmp.getY());
                                                    })
                                                }
                                            }
                                        },
                                        {
                                            html: 'Delete',
                                            cls: 'thinBorder tipshortcut',
                                            width: 70,
                                            observer: observer,
                                            meetingId: meetingId,
                                            listeners: {
                                                delay: 1000,
                                                scope: this,
                                                afterrender: function(targetCmp) {
                                                    targetCmp.mon(targetCmp.el, 'click', function(){
                                                        Ext.each(targetCmp.observer.meetingCallouts, function(callout){
                                                            callout.hide();
                                                        })
                                                        targetCmp.observer.deleteMeetingItem(targetCmp.meetingId);
                                                    })
                                                }
                                            }
                                        },
                                        {
                                            flex: 1
                                        }
                                    ]
                                }
                            ]
                        })
                    },
                    beforeshow: function(cmp){
                        //This prevents the component from having a null shadow
                        Ext.each(Ext.query('.mtg-instance'), function(cmp){
                            var origCmp = Ext.getCmp(cmp.id);
                            origCmp.el.shadow = null;
                        })
                        Ext.each(cmp.observer.meetingCallouts, function(callout){
                            callout.hide();
                        })
                                                
                    },
                    show: function(cmp){
                        new Ext.util.DelayedTask(function(){
                            //var centerCoords = cmp.parent.getCenterXY();
                            var x = cmp.targetCoords.xCenter - (cmp.getWidth() / 2);
                            var y = cmp.targetCoords.yCenter;
                            cmp.setX(x);
                            cmp.setY(y);
                        }, me).delay(10);  
                    }
                }
            })   
        }
        var mtg = observer.getMeeting(id, observer);
        if (!mtg)
            mtg = m;
        var mtgHtml = '<div class="truncate">' + 
                        '<span class="mtg-instance-text">' + text  + "</span></br>" + 
                        '<span class="mtg-instance-title">' + mtg.room_setup_type.title + " | " + mtg.num_people +"pp</span>"
                       '</div>';
        var cmp = Ext.create('Ext.Component', {
            html: mtgHtml,
            floating: true,
            height : height - 6,
            width: width,
            cls: 'mtg-instance',
            meetingId: id,
            date: date,
            observer: observer,
            renderCallBack: renderCallBack,
            style: {
                paddingTop: '3px',
                paddingLeft: '3px',
                color: fontColor,
                backgroundColor: color,
                borderRadius: '3px'
            },
            x: xy[0] - datesCtrXY[0],
            y: xy[1] - datesCtrXY[1] + 3,
            renderTo: datesCtr.el,
            resizable:{
                handles: 'e w',
                widthIncrement: 5, 
                pinned: true,
                dynamic: true
            },
            getCurrentRow: function(){
                var me = cmp;
                var y = me.getY();
                var centerY = Ext.getCmp(Ext.query('.centerCtr')[0].id).getY();
                var rowOffset = 50;
                var rowPosition = y - centerY;
                return Math.round(rowPosition / rowOffset);
            },
            getRelativeRow: function(){
                var me = cmp;
                var y = me.getY();
                var row = observer.getRow(me.date);
                var cmpY = Ext.getCmp(row.rows[0].id).getY();
                var centerY = Ext.getCmp(Ext.query('.centerCtr')[0].id).getY();
                var rowOffset = 50;
                var rowPosition = y - cmpY;
                return Math.round(rowPosition / rowOffset) + 1;
            },
            saveHrChange: function(cmp, target){
                var match = null;
                var rect = cmp.el.dom.getBoundingClientRect();
                var y = (rect.top + rect.bottom) / 2; //We'll get the center
                var mtg = cmp.observer.getMeeting(cmp.meetingId, cmp.observer);
                if (!mtg)
                    throw("Meeting not found");
                
                var date = mtg.date;
                var start = null;
                var end = null;
                //***********Start Time */
                //If the drag target is the east --> then we aren't changing the start time
                if (target == 'east')
                {
                    start = mtg.start_time.replace('1900/01/01 ', '');
                }
                else
                {
                    //Now let's  find the starting timeslot
                    var startingPoint = rect.left + 1; //shifted one pixel to make sure we are on the starting block                       
                    Ext.each(document.elementsFromPoint(startingPoint, y), function(el){
                    if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
                        match = el;
                    })
                    
                    if (match == null)
                    {
                        if (target != 'west')
                            throw('error finding match in date');
                        else
                            start = '06:00:00';
                    }
                    else
                        start = (match.dataset.hour)
                    
                    if (!start)
                        start = '06:00:00';

                    if (!date && match && match.dataset && match.dataset.date)
                        date = me.createDate(match.dataset.date.stripInvalidChars());                            
                
                }
                //*****************End Time ***********/
                if (target == 'west') //<-- we don't need to touch the end
                {
                    end = mtg.end_time.replace('1900/01/01 ', '');
                }
                else
                {
                    var endingPoint = rect.right + 10;// - 1; //shifted one pixel to make sure we are on the ending point
                    Ext.each(document.elementsFromPoint(endingPoint, y), function(el){
                    if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
                        match = el;
                    })
                    if (match)
                        end = (match.dataset.hour);
                    if (!end)
                    {
                        end = "23:59:00";                            
                    }
                    if (!date && match && match.dataset && match.dataset.date)
                        date = me.createDate(match.dataset.date.stripInvalidChars());                            
                }
                
                /********************Done End */

                if (!date)
                {
                    Ext.each(me.dates, function(myDate)
                    {
                        Ext.each(myDate.meetings, function(myMtg){
                            if (myMtg.id == mtg.id)
                                date = myDate.date;
                        })
                    });
                }

                var dimensions = me.getDimensions(mtg.rowIndex -1, date, start, end);
                var m_cmp = me.findMeetingComponent(mtg.id);
                new Ext.util.DelayedTask(function(){
                    m_cmp.setX(dimensions.xy[0]);
                    m_cmp.setWidth(dimensions.width);
                }, me).delay(500); 
                if (mtg.start_time.replace('1900/01/01 ', '') == start &&
                    mtg.end_time.replace('1900/01/01 ', '') == end)
                {
                    cmp.observer.unmask();
                    return;
                }                
                mtg.start_time = start;
                mtg.end_time = end;
                mtg.date = date;
                cmp.observer.saveMeetingItem(mtg);
            },
            listeners: {
                delay: 100,
                afterrender: function(cmp) {
                    var resizer = cmp.resizer;
                    if( resizer && resizer.resizeTracker ) {
                        resizer.resizeTracker.on('mouseup', function( resizeTracker, e ) {
                            cmp.observer.mask();
                            var target = null;
                            if (resizeTracker && resizeTracker.dragTarget 
                                && resizeTracker.dragTarget.className 
                                && resizeTracker.dragTarget.className.indexOf)
                            {
                                if (resizeTracker.dragTarget.className.indexOf('x-resizable-handle-east') > -1)
                                    target = 'east';
                                else if (resizeTracker.dragTarget.className.indexOf('x-resizable-handle-west') > -1)
                                    target = 'west';
                            }
                            cmp.saveHrChange(cmp, target);
                            Ext.each(cmp.observer.meetingCallouts, function(callout){
                                callout.hide();
                            })
                        })
                    }
                    cmp.mon(cmp.el, 'click', function(){
                        var xCenter = null;
                        var yCenter = null;
                        if (cmp.getCenterXY)
                        {
                            var centerXY = cmp.getCenterXY();
                            var yCenter = centerXY.y - 3;
                            var xCenter = centerXY.x;// - 3;
                        }
                        else
                        {
                            var rect = cmp.el.dom.getBoundingClientRect();
                            xCenter = x + (rect.width / 2);
                            yCenter = y + (rect.height/2);
                        }
                        var x = cmp.getX();
                        var y = cmp.getY();
                        cmp.extender.targetCoords = {
                            x : x,
                            xCenter : xCenter,
                            y: y,
                            yCenter : yCenter
                        };
                        cmp.extender.show();
                    })

                    cmp.mon(cmp.el, 'dblclick', function(){
                        var mtg = cmp.observer.getMeeting(cmp.meetingId, cmp.observer);
                        mtg.date = cmp.observer.getDate(cmp.meetingId, cmp.observer);
                        Ext.each(cmp.observer.meetingCallouts, function(callout){
                            callout.hide();
                        })
                        cmp.observer.showMeetingEditor(mtg, cmp.observer, mtg.meeting_item_type, mtg.date, cmp.getY());
                    })

                    cmp.mon(cmp.el, 'mousedown', function(e){
                        		var overrides = {
                                    // Called the instance the element is dragged.
                                        b4StartDrag : function() {
                                            cmp.dragEnded = false;
                                            Ext.each(observer.meetingCallouts, function(callout){
                                                callout.hide();
                                            })
                                            // Cache the drag element
                                            if (!cmp.el) {
                                                cmp.el = Ext.get(this.getEl());
                                            }
                                            cmp.origX = cmp.getX();
                                            cmp.origY = cmp.getY();
                                            observer.currentDragMtg = cmp; //Used to track the cmp being dragged
                                        },
                                        // Called when element is dropped in a spot without a dropzone, or in a dropzone without matching a ddgroup.
                                        onInvalidDrop : function(target) {
                                            // Set a flag to invoke the animated repair
                                            cmp.invalidDrop = false;
                                        },
                                        onMouseUp: function(e){
                                            if (cmp.dragEnded)
                                                return;
                                        }, 
                                        // Called when the drag operation completes
                                        endDrag : function(dropTarget, invalidate, mtgCmp, forceCallInvalidate) {
                                            if (mtgCmp)
                                                cmp=mtgCmp;
                                            observer.currentDragMtg = null; //Drag is over, so don't track it.
                                            observer.currentDragDrop = null;
                                            observer.hideDragDropHourPreview(observer);
                                            cmp.dragEnded = true;
                                            Ext.each(Ext.query('td'), function(dtel){
                                                    dtel.classList.remove('shaded');
                                            })
                                            var match = null;
                                            var browserEvent = null;
                                            if (dropTarget && dropTarget.parentEvent && dropTarget.parentEvent.browserEvent)
                                            {
                                                browserEvent = dropTarget.parentEvent.browserEvent;
                                            }
                                            else if (dropTarget && dropTarget.browserEvent)
                                            {
                                                browserEvent = dropTarget.browserEvent;
                                            }
                                            
                                            var invalidDrop = function(){
                                                if (cmp && cmp.el && cmp.el.removeCls)
                                                    cmp.el.removeCls('dropOK');
                                                if (cmp.origX)
                                                    cmp.setX(cmp.origX);
                                                if (cmp.origY)
                                                    cmp.setY(cmp.origY);
                                                delete cmp.invalidDrop;
                                                delete cmp.origX;
                                                delete cmp.origY;
                                            }
                                            if (forceCallInvalidate)
                                            {
                                                invalidDrop();
                                                if (observer.currentDragDrop &&
                                                    observer.currentDragDrop.DDMInstance &&
                                                    observer.currentDragDrop.DDMInstance.stopDrag)
                                                    observer.currentDragDrop.DDMInstance.stopDrag()
                                                return;
                                            }
                                            if (browserEvent == null || invalidate == true)
                                            {
                                                return;
                                            }
                                            var x = browserEvent.clientX;
                                            var y = browserEvent.clientY;
                                            Ext.each(document.elementsFromPoint(x, y), function(el){
                                                if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
                                                    match = el;
                                            })
                                            var instance = null;
                                            if (match && match.dataset && match.dataset.date)
                                            {
                                                var instanceDate = observer.createDate(match.dataset.date.stripInvalidChars());
                                                instance = observer.getInstance(instanceDate, observer);
                                            }
                                            
                                            
                                            // Invoke the animation if the invalidDrop flag is set to true
                                            if (match == null || !match.dataset || !match.dataset.date || !match.dataset.hour || (
                                                instance && instance.visible == false)) {
                                                // Remove the drop invitation
                                                invalidDrop();
                                            }
                                            else{
                                                var d = observer.createDate(match.dataset.date.stripInvalidChars());
                                                var parentId = match.id.substring(0, match.id.indexOf('-col'));
                                                var rowCmp = Ext.getCmp(parentId);
                                                var rowIndex = rowCmp.getRowIndex();
                                                var matchingEl = null;
                                                var rect = cmp.el.dom.getBoundingClientRect();
                                                var y = (rect.top + rect.bottom) / 2; //We'll get the center

                                                //Now let's  find the starting timeslot
                                                var startingPoint = rect.left + 1; //shifted one pixel to make sure we are on the starting block                       
                                                Ext.each(document.elementsFromPoint(startingPoint, y), function(el){
                                                if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
                                                    matchingEl = el;
                                                })
                                                if (matchingEl == null)
                                                    throw('error finding match in date');
                                                var start = (matchingEl.dataset.hour)
                                                if (!start)
                                                    start = '06:00:00';
                                                var endingPoint = rect.right + 10;// - 1; //shifted one pixel to make sure we are on the ending point
                                                Ext.each(document.elementsFromPoint(endingPoint, y), function(el){
                                                    var colIdx = 0;
                                                    if (el && el.dataset && el.dataset.colindex)
                                                        colIdx = el.dataset.colindex * 1;
                                                    if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
                                                        matchingEl = el;
                                                })
                                                var end = (matchingEl.dataset.hour);
                                                var mtg = cmp.observer.getMeeting(cmp.meetingId, cmp.observer);
                                                if (!end)
                                                {
                                                    end = "23:59:00";
                                                    var diff = Math.abs(mtg.start - mtg.end);
                                                    var startBasedOnShift = new Date(new Date("1900/01/01 23:59:00") - diff);    
                                                    if (startBasedOnShift.getHours() < 6)
                                                    {
                                                        start = mtg.start_time.replace('1900/01/01 ', '');
                                                        end = mtg.end_time.replace('1900/01/01 ', '');
                                                    }
                                                    else
                                                        start = Ext.Date.format(startBasedOnShift, 'H:i:s');  
                                                                   
                                                }
                                                if (start == end)
                                                {
                                                    start = mtg.start_time.replace('1900/01/01 ', '');
                                                    end = mtg.end_time.replace('1900/01/01 ', '');
                                                }
                                                var dimensions = cmp.observer.getDimensionsByRowIndex(rowIndex, start, end);
                                                if (!dimensions)
                                                {
                                                    invalidDrop();
                                                    return;
                                                }
                                                var m_cmp = cmp.observer.findMeetingComponent(mtg.id);
                                                m_cmp.setX(dimensions.xy[0]);
                                                m_cmp.setY(dimensions.xy[1] + 3);
                                                
                                                if (me.areTwoDatesEqual(d, m_cmp.date) && mtg.start_time.replace('1900/01/01 ', '') == start &&
                                                     mtg.end_time.replace('1900/01/01 ', '') == end)
                                                     {
                                                        invalidDrop();
                                                        return;
                                                     }
                                                mtg.start_time = start;
                                                mtg.end_time = end;
                                                mtg.date = d;
                                                cmp.observer.saveMeetingItem(mtg);
                                               
                                            }
                                        }

                                };

                                 var dd = Ext.create('Ext.dd.DD', cmp, 'meetingDate', {
                                            isTarget  : false
                                    });
                                    Ext.apply(dd, overrides);
                                    dd.setStartPosition();
                                    dd.b4MouseDown(e);
                                    dd.onMouseDown(e);
                                    dd.DDMInstance.handleMouseDown(e, dd);
                                    //dd.DDMInstance.handleMouseOut(e, dd);
                                    dd.DDMInstance.stopEvent(e);
                                    cmp.observer.currentDragDrop = dd;
                    });
                    cmp.observer.monitorMeetingHandle(cmp);
                    cmp.mon(cmp.el, 'mouseup', function(){
                        cmp.saveHrChange(cmp);
                    })
                   cmp.observer.addDragOverListener(cmp.el.dom, cmp.observer);
                    if (cmp.renderCallBack && Ext.isFunction(cmp.renderCallBack))
                        cmp.renderCallBack(mtg);

                    var titleCmpRatio = {
                        mtgCmpWidth : cmp.getWidth(),
                        titleWidth : Ext.fly(cmp.el.query('.mtg-instance-title')[0]).getWidth()
                    };
                    if (titleCmpRatio.titleWidth > titleCmpRatio.mtgCmpWidth)
                    {
                        cmp.removeCls('inRatioMtg');
                    }
                    else
                    {
                        cmp.addCls('inRatioMtg');
                    }
                }
            }

        });

        this.meetingCallouts.push(createTip(cmp, datesCtr, id, this, color, fontColor, text));
        
        return m;
    },
    showDragDropHourPreview: function(xCoord, yCoord, startHr, endHr, scope){
        var me=this;
        if (scope)
            me = scope;
        var html = Ext.String.format('<div style="height:75px;display: flex;align-items: center; justify-content: center">{0} - {1}</div>', 
                            startHr, endHr);
        if (!me.dragDropHourPreview)
        {
            me.dragDropHourPreview = Ext.create('Ext.Container', {
			            html: html,
			            cls: 'dragDropHourPreview',
			            floating: true,
			            height : 75,
			            width: 200,
			            x: xCoord,
			            y: yCoord,
			            renderTo: Ext.getBody()
			        });
        }
        else
        {
            me.dragDropHourPreview.update(html);
            me.dragDropHourPreview.removeCls('invisible');
            me.dragDropHourPreview.setHeight(75);
            me.dragDropHourPreview.setX(xCoord);
            me.dragDropHourPreview.setY(yCoord);
        }
        me.dragDropHourPreview.el.setStyle('z-index', '100000')

    },
    hideDragDropHourPreview: function(scope){
        var me=this;
        if (scope)
            me = scope;
        if (me.dragDropHourPreview)
        {
            me.dragDropHourPreview.addCls('invisible');
            me.dragDropHourPreview.setHeight(0);
        }
    },


    monitorMeetingHandle: function(cmp){
        Ext.each(Ext.query('.x-resizable-handle'), function(q){
            var fly = new Ext.fly(q);
            if (!fly)
                return;
            fly.el.dom.classList.add('x-resizable-pinned-mtg');
        });
        
        cmp.mon(cmp.el, 'mouseover', function(mEvent){
            Ext.each(cmp.el.query('.x-component-handle'), function(handle){
                handle.classList.add('x-resizable-pinned-mtg-hover');
                handle.classList.remove('x-resizable-pinned-mtg');
            });
        });

        cmp.mon(cmp.el, 'mouseout', function(mEvent){
            Ext.each(cmp.el.query('.x-component-handle'), function(handle){
                handle.classList.add('x-resizable-pinned-mtg');
                handle.classList.remove('x-resizable-pinned-mtg-hover');
            });
        });

    },
    getRowAt: function(index){
        var match = null;
        Ext.each(Ext.query('.agendaRowClass'), function(el){
            var cmp = Ext.getCmp(el.id);
            if (cmp.getRowIndex() == index)
                match = cmp;
        })
        return match;
    },
    getMeetingHtml: function(titleText, meetingId){
        return Ext.String.format('<div class="title-text" style="font-size:larger; margin-left:auto;margin-right:auto;text-align:center;">{0}' + 
        '<i id="closemtg{1}" style="margin-top: 3px; margin-right: 2px; float: right;" class="fa fa-times-circle fa-lg close-tip" aria-hidden="true"></i></div>',
        titleText, meetingId);
    },
    getMeeting: function(meetingId, scope){
        var mtg = null;
        Ext.each(scope.dates, function(instance){
            Ext.each(instance.meetings, function(meeting){
                if (meeting.id == meetingId)
                    mtg = meeting;
            })                
        });
        return mtg;
    },
    getOverlappingSimilarMeetings: function(source, scope){
        var mtgs = [];
        var date = null;
        var start = null;
        var end = null;
        if (source.date)
            date = scope.createDate(source.date);
        else if (source.start)
            date = source.start;
//zzz
        if (source.start)
            start = source.start;
        else
            start = scope.createDateWithTime(date, source.start_time.replace('1900/01/01 ', ''));
        if (source.end)
            end = source.end;
        else
            end = scope.createDateWithTime(date, source.end_time.replace('1900/01/01 ', ''));
        
        Ext.each(scope.dates, function(instance){
            if (instance.date && date && scope.areTwoDatesEqual(instance.date, date))
            {
                Ext.each(instance.meetings, function(meeting){
                    var overLaps = false;
                    //if the end happens in the range of the meeting
                    if (end <= meeting.end && end >= meeting.start)
                        overLaps = true;
                    //if the start happens in the range of the meeting
                    if (start >= meeting.start && start <= meeting.end)
                        overLaps = true;
                    
                    if (meeting.id != source.id && meeting.meeting_item_type.color == source.meeting_item_type.color && overLaps)
                    {
                        mtgs.push(meeting);
                    }
                })             
            }
        });
        return mtgs;
    },
    deleteMeeting: function(meetingId, scope){
        this.removeMeeting(meetingId);
        Ext.each(scope.dates, function(instance){
            var mtgs = [];
            Ext.each(instance.meetings, function(meeting){
                if (meeting.id != meetingId)
                    mtgs.push(meeting);
            })            
            instance.meetings = mtgs;    
        });        
    },
    getDate: function(meetingId, scope){
        var date = null;
        Ext.each(scope.dates, function(instance){
            Ext.each(instance.meetings, function(meeting){
                if (meeting.id == meetingId)
                    date = instance.date;
            })                
        });
        return date;
    },
    findMeetingComponent: function(meetingId){
        var match = null;
        Ext.each(Ext.query('.mtg-instance'), function(cmp){
            var origCmp = Ext.getCmp(cmp.id);
            if (origCmp.meetingId == meetingId)
                match = origCmp;
        })
        return match;
    },
    findMeetingTip: function(meetingId){
        var match = null;
        Ext.each(Ext.query('.mtg-tip-ctr'), function(cmp){
            var origCmp = Ext.getCmp(cmp.id);
            if (origCmp.meetingId == meetingId)
                match = origCmp;
        })
        if (!match)
            console.warn("Tip not found " + meetingId);
        return match;
    },
    moveMeetingDownXRows: function(meetingId, rowCount, scope){
        var me = scope;
        var mtg = me.findMeetingComponent(meetingId);
        var shift = rowCount * 50;        
        
        if (mtg == null)
        {
            console.warn("Mtg not found : " + meetingId);
            return;
        }
        var y = mtg.getY();
        mtg.setY(y + shift);

        var tip = me.findMeetingTip(meetingId);
        if (tip == null)
        {
            console.warn("Tip not found : " + meetingId);
            return;
        }
        var existingShift = tip.pendingShift ? tip.pendingShift : 0;
        tip.pendingShift = existingShift + ((rowCount) * 50);
    },
    moveMeetingUpXRows: function(meetingId, rowCount, scope){
        var me = scope;
        var mtg = me.findMeetingComponent(meetingId);
        if (mtg == null)
            return;
        
        var y = mtg.getY();
        var shift = rowCount * 50;
        mtg.setY(y - shift);

        var tip = me.findMeetingTip(meetingId);
        if (tip == null)
            return;
        var tipShift = (rowCount + 1) * 50;
        var tipY = tip.getY();
        tip.setY(tipY - tipShift);
    },
    removeMeeting: function(id){
        //Remove the meeting from the grid        
        Ext.each(Ext.query('.mtg-instance'), function(cmp){
            var origCmp = Ext.getCmp(cmp.id);
            if (origCmp.meetingId == id)
                origCmp.destroy();
        })
        //destroy the callout

        
    },
    pushBackFocus: function(scope){
        var me = !scope ? this : scope;
        Ext.each(me.meetingCallouts, function(callout){
                callout.hide();
            })
        Ext.each(Ext.query('.mtg-instance'), function(el){
            if (el && el.style && el.style.zIndex)
                el.style.zIndex = 1000;
        });
    },
    updateMeetingId: function(meetingId, newId, scope){
        var me = scope;
        var mtg = me.findMeetingComponent(meetingId);
        if (mtg == null)
            return;
        mtg.meetingId = newId;
        var tip = me.findMeetingTip(meetingId);
        if (tip == null)
            return;
        tip.meetingId = newId;
        //tipshortcut
        Ext.each(Ext.query('.tipshortcut'), function(e){
            var c = Ext.getCmp(e.id);
            if (meetingId == c.meetingId)
                c.meetingId = newId; 
        })
    },
    subScribeOnMtgClick: function(meetingId, scope){
        var cmp = Ext.get(Ext.query('#closemtg' + meetingId)[0].id)
        var fly = new Ext.fly(Ext.query('#closemtg' + meetingId)[0]);
        fly.on('click', function(){
            Ext.each(scope.meetingCallouts, function(callout){
                callout.hide();
            })
        });
    },
    updateMeetingText: function(meetingId, title, start, end, room_setup_type, num_people, scope){
        try
        {
            var me = scope;
            var tip = me.findMeetingTip(meetingId);
            if (tip == null)
                return;
            
            var titleText = Ext.String.format('{0}<i id="closemtg{1}" style="margin-top: 3px; margin-right: 2px; float: right;" class="fa fa-times-circle fa-lg close-tip" aria-hidden="true"></i>',
            title, meetingId);
            tip.el.down('.callout-title').down('.title-text').el.dom.innerHTML = titleText;
            var html = '<div class="callout-time" style="text-align:center;">' + me.getDisplayHours(start) + " - " + me.getDisplayHours(end)  + "<div>" + 
                                                '<div class="callout-room" style="text-align:center;">' + room_setup_type.title + " | " + num_people +"pp</div>";
            Ext.fly(tip.el.down('.thinBorderBottom')).update(html);

            var mtg = me.findMeetingComponent(meetingId, me);
            if (mtg == null)
                return;
            var mtgHtml = '<div class="truncate">' + 
                            '<span>' + title  + "<span><div>" + 
                            '<span>' + room_setup_type.title + " | " + num_people +"pp</span>"
                        '</div>';
            mtg.el.down('.mtg-instance-text').el.dom.innerText = title;
            mtg.el.down('.mtg-instance-title').el.dom.innerText = room_setup_type.title + " | " + num_people +"pp";
            var titleCmpRatio = {
                            mtgCmpWidth : mtg.getWidth(),
                            titleWidth : Ext.fly(mtg.el.query('.mtg-instance-title')[0]).getWidth()
            };
            if (titleCmpRatio.titleWidth > titleCmpRatio.mtgCmpWidth)
            {
                mtg.removeCls('inRatioMtg');
            }
            else
            {
                mtg.addCls('inRatioMtg');
            }
            scope.subScribeOnMtgClick(meetingId, scope);
        }
        catch(e)
        {
            console.warn(e);
        }
    },
    getRow: function(date){
        var row = null;
        Ext.each(this.agendaBuilderRows, function(r){
            if (r.date.valueOf() == date.valueOf())
            {
                row = r;
            }
        })
        return row;
    },
    getRows: function(){
        return this.agendaBuilderRows;
    },
    setRfpNumber: function(n){
        if (!n)
            throw ('A valid rfp number must be provided');
        this.rfpNumber = n;
    },
    getMeetingType: function(id){
        if (!this.meeting_item_types)
            throw ("Meeting Item Types must be initialized first");
        for(var i = 0; i < this.meeting_item_types.length; i++)
        {
            if (this.meeting_item_types[i].id == id)
                return this.meeting_item_types[i];
        }
        return null;
    },
    getRoomSetup: function(id){
        if (!this.room_setups)
            throw("Room Setups must be initialized first")
        for(var i = 0; i < this.room_setups.length; i++)
        {
            if (this.room_setups[i].id == id)
                return this.room_setups[i];
        }
        return null;
    },
    showMeetingEditor: function(meeting, observer, meetingTemplate, date, ycoord){
        var me = this;
        var datesCtr = Ext.ComponentQuery.query('#MainContainer')[0];
        Ext.create('MeetingEditor', {
            meeting: meeting,
            alignTarget: datesCtr,
            observer: observer,
            meetingTemplate: meetingTemplate,
            date: date,
            ycoord: ycoord
        }).show();

    },
    /*******************Scrolling Functionality************/
    setScrollingHandlers: function(){
        var runner = new Ext.util.TaskRunner();
        //We are dealing with the left and right scrolling here
        var rightNorthCtrMtg = Ext.ComponentQuery.query('#rightNorthCtrMtg')[0];
        var leftNorthCtrMtg = Ext.ComponentQuery.query('#leftNorthCtrMtg')[0];
        var northCtrMtg = Ext.ComponentQuery.query('#northCtrMtg')[0];
        var northCtrMtgItems = northCtrMtg.items.items;
        var mtgFarLeft = northCtrMtg.getX();
        var mtgFarRight = mtgFarLeft + northCtrMtg.getWidth();
        var rightNorthCtrHandler = function(applyClass){
            var lastItem = northCtrMtgItems[northCtrMtgItems.length - 1];
            if (lastItem.getX() + lastItem.getWidth() <= mtgFarRight)
            {
                if (applyClass)
                    rightNorthCtrMtg.addCls('btn-disable');
                return;
            }
            Ext.each(northCtrMtgItems, function(i){
                i.setX(i.getX() - 20);
            })
            if (applyClass)
                leftNorthCtrMtg.removeCls('btn-disable');
        };
        rightNorthCtrMtg.mon(rightNorthCtrMtg.el, 'click', function(){rightNorthCtrHandler(true)});
        rightNorthCtrMtg.task = runner.newTask({
            run: function() {
                rightNorthCtrHandler();},
            interval: 50 // 1-minute interval
        });
        rightNorthCtrMtg.mon(rightNorthCtrMtg.el, 'mousedown', function(){
            leftNorthCtrMtg.removeCls('btn-disable');
            rightNorthCtrMtg.task.start()
        });        
        rightNorthCtrMtg.mon(rightNorthCtrMtg.el, 'mouseup', function(){rightNorthCtrMtg.task.stop()});

        var leftNorthCtrHandler = function(applyClass){
            if (northCtrMtgItems[0].getX() >= mtgFarLeft)
            {
                if (applyClass)
                    leftNorthCtrMtg.addCls('btn-disable');
                return;
            }
            Ext.each(northCtrMtgItems, function(i){
                i.setX(i.getX() + 20);
            })
            if (applyClass)
                rightNorthCtrMtg.removeCls('btn-disable');
        };
        leftNorthCtrMtg.mon(leftNorthCtrMtg.el, 'click', function(){leftNorthCtrHandler(true)});
        leftNorthCtrMtg.task = runner.newTask({
            run: function() {
                leftNorthCtrHandler();
            },
            interval: 50 // 1-minute interval
        });
        leftNorthCtrMtg.mon(leftNorthCtrMtg.el, 'mousedown', function(){
            rightNorthCtrMtg.removeCls('btn-disable');
            leftNorthCtrMtg.task.start()
        });        
        leftNorthCtrMtg.mon(leftNorthCtrMtg.el, 'mouseup', function(){leftNorthCtrMtg.task.stop()});


        var rightNorthCtrMeal = Ext.ComponentQuery.query('#rightNorthCtrMeal')[0];
        var leftNorthCtrMeal = Ext.ComponentQuery.query('#leftNorthCtrMeal')[0];
        var northCtrMeal = Ext.ComponentQuery.query('#northCtrMeal')[0];
        var northCtrMealItems = northCtrMeal.items.items;
        var mealFarLeft = northCtrMeal.getX();
        var mealFarRight = mealFarLeft + northCtrMeal.getWidth();
        
        var rightClickMealHandler = function(applyClass){
            var lastItem = northCtrMealItems[northCtrMealItems.length - 1];
            if (lastItem.getX() + lastItem.getWidth() <= mealFarRight)
            {
                if (applyClass)
                    rightNorthCtrMeal.addCls('btn-disable');
                return;
            }
            Ext.each(northCtrMealItems, function(i){
                i.setX(i.getX() - 20);
            })
            if (applyClass)
                leftNorthCtrMeal.removeCls('btn-disable');
        }
        var leftClickMealHandler = function(applyClass){
            if (northCtrMealItems[0].getX() >= mealFarLeft)
            {
                if (applyClass)
                    leftNorthCtrMeal.addCls('btn-disable');
                return;
            }
            Ext.each(northCtrMealItems, function(i){
                i.setX(i.getX() + 20);
            })
            if (applyClass)
                rightNorthCtrMeal.removeCls('btn-disable');
        }
        rightNorthCtrMeal.mon(rightNorthCtrMeal.el, 'click', function() {rightClickMealHandler(true)});
        rightNorthCtrMeal.task = runner.newTask({
            run: function() {
                rightClickMealHandler();
            },
            interval: 50 
        });
        rightNorthCtrMeal.mon(rightNorthCtrMeal.el, 'mousedown', function(){
            leftNorthCtrMeal.removeCls('btn-disable');
            rightNorthCtrMeal.task.start();
        });        
        rightNorthCtrMeal.mon(rightNorthCtrMeal.el, 'mouseup', function(){rightNorthCtrMeal.task.stop()});

        leftNorthCtrMeal.mon(leftNorthCtrMeal.el, 'click', function(){leftClickMealHandler(true)});
        leftNorthCtrMeal.task = runner.newTask({
            run: function() {
                leftClickMealHandler();
            },
            interval: 50 
        });
        leftNorthCtrMeal.mon(leftNorthCtrMeal.el, 'mousedown', function(){
            rightNorthCtrMeal.removeCls('btn-disable');
            leftNorthCtrMeal.task.start();
        });        
        leftNorthCtrMeal.mon(leftNorthCtrMeal.el, 'mouseup', function(){leftNorthCtrMeal.task.stop()});
                
    },
    convertTimeTo12Hrs: function(time, minHour){
        time.adjustMidnight(); //midnight is the next day
        time = time.replace('1900/01/01 ', '');
        var hr = time.substring(0,2) * 1;
        var slice = "AM"
        if (hr > 12)
        {
            hr = hr - 12;
            slice = "PM";
        }
        var min = time.substring(3,5);
        
        if (minHour && slice == "AM" && hr < minHour) //if a min hour is provided and the min hour is less than the one provide, we go to 11:30PM
        {
            hr = 12;
            min = '00';
            slice = "AM";
        }
        if (hr == 12 && (min == '00' || min == '30'))
            slice = 'PM';
        var v  = Ext.String.format("{0}:{1} {2}", hr, min, slice);
        return v;
    },
    convertTimeTo24Hrs: function(time){
        try
        {
            time = time.toUpperCase();
            time.adjustMidnight();
            var hours = Number(time.match(/^(\d+)/)[1]);
            var minutes = Number(time.match(/:(\d+)/)[1]);
            if(time.indexOf('PM') != -1 && hours<12) hours = hours+12;
            if(time.indexOf('AM') != -1 && hours==12) hours = hours-12;
            var sHours = hours.toString();
            var sMinutes = minutes.toString();
            if(hours<10) sHours = "0" + sHours;
            if(minutes<10) sMinutes = "0" + sMinutes;
            return sHours + ":" + sMinutes;
        }
        catch(e)
        {
            return null;
        }
    },
    getDisplayHours : function(time){
            if (!time)
                return '';
            var hours = time.getHours();
            var amPm = "AM"
            if (hours == 0)
            {
                time.setHours(23);
                time.setMinutes(59);
                hours = 11;
                amPm = "PM";
            }
            var minutes = time.getMinutes();
            if (hours >= 12)
            {
                amPm = "PM";                    
            }
            if (hours >= 13)
                hours-=12;
            var minStr = minutes.toString().length < 2 ? "0" + minutes.toString() : minutes.toString();
            return Ext.String.format("{0}:{1} {2}", hours, minStr, amPm)
    },
    getHourFor24Hrs: function(time){
        time = time.toUpperCase()
        time.adjustMidnight();
        var hours = Number(time.match(/^(\d+)/)[1]);
        var minutes = Number(time.match(/:(\d+)/)[1]);
        if(time.indexOf('PM') != -1) hours = hours+12;
        if(time.indexOf('AM') != -1 && hours==12) hours = hours-12;
        var sHours = hours.toString();
        var sMinutes = minutes.toString();
        if(hours<10) sHours = "0" + sHours;
        if(minutes<10) sMinutes = "0" + sMinutes;
        return sHours * 1;
    },
    /*******************Ajax callbacks**************/
    onGetRoomSetups: function(obj, scope){
        scope.room_setups = obj;
        scope.fireEvent('getroomsetups', obj);
    },
    onGetMeetingItemTypes: function(obj, scope){
        scope.meeting_item_types = obj;
        scope.buildMeetings(obj);
        scope.fireEvent('getmeetingitemtypes', obj);
    },
    onGetMeetingItems: function(obj, scope){
        var convertedData = [];
        Ext.each(obj, function(data)
        {
            var d = {            
                date: scope.createDate(data.date),
                room_block: data.room_block,
                room_night: data.room_night,
                meetings: data.meeting_items,
            };
            Ext.each(d.meetings, function(m){
                m.meeting_item_type = scope.getMeetingType(m.type);
                m.room_setup_type = scope.getRoomSetup(m.room_setup);
            })
            convertedData.push(d);
        });
        scope.fireEvent('getmeetingitems', convertedData);
    },
    getMaxRowsForDate: function(meetings){
            var maxRow = 0;                 
                 Ext.each(meetings, function(lmtg){
                     if (lmtg.rowIndex > maxRow)
                        maxRow = lmtg.rowIndex
                 });
            return maxRow;
    },
    onSaveMeetingItem: function(postedData, response, scope){
        var me = scope;
        me.currentDragDrop = null;
        var agendaBuilderRow = me.getRow(postedData.date);
        if (agendaBuilderRow == null)
            throw "Row Not found";
        var newRows = [];
        var savedMeeting = {};
        me.fireEvent('meetingSaveStart', {newId:response.id, postedData: postedData});
        if (!me.getMeeting(postedData.id, me))
            postedData.id = null;
        //Create a new meeting since it has not id
        if (!postedData.id || !me.getMeeting(postedData.id, me))
        {
            scope.updateMeetingId(postedData.id == null ? 0 : postedData.id, response.id, scope);
            postedData.id = response.id;        
            savedMeeting = {
                all_day : postedData.all_day,
                booths  : postedData.booths,
                date    : postedData.date,
                end_time: '1900/01/01 ' + postedData.end_time,
                id      : response.id,
                note    : postedData.note,
                num_people: postedData.num_people,
                posters : postedData.posters,
                room_setup: postedData.room_setup,
                square_feet: postedData.square_feet,
                start_time: '1900/01/01 ' + postedData.start_time,
                tabletops: postedData.tabletops,
                title   : postedData.title,
                type    : postedData.type,
                meeting_item_type : scope.getMeetingType(postedData.type),
                room_setup_type : scope.getRoomSetup(postedData.room_setup),
                oldRowIndex: 1 //We always start at row 1
            };
            var count = null;
            var newRowCount = agendaBuilderRow.rowCount;            
        }
        else //update the existing meeting
        {
            if (postedData.end_time.indexOf('1900/01/01 ') == -1)
                postedData.end_time = '1900/01/01 ' + postedData.end_time;
            if (postedData.start_time.indexOf('1900/01/01 ') == -1)
                postedData.start_time = '1900/01/01 ' + postedData.start_time;
            savedMeeting = me.getMeeting(postedData.id, scope);  
            postedData.meeting_item_type = scope.getMeetingType(postedData.type),
            postedData.room_setup_type = scope.getRoomSetup(postedData.room_setup),
            Ext.apply(savedMeeting, postedData);              
        }
        //yyy
        //update the meeting data with the saved info or create  a new entry
        Ext.each(scope.dates, function(instance){
            if (me.areTwoDatesEqual(postedData.date, instance.date))
            {
                var match = false;
                Ext.each(instance.meetings, function(meeting){
                    if (meeting.id == savedMeeting.id)
                    {
                        match = true;
                        Ext.apply(meeting, savedMeeting)
                    }
                })
                if (!match)
                    instance.meetings.push(savedMeeting);
                newRowCount = me.assignRowIndexes(instance);
            }
            newRows.push(instance);
        });
        var fmtTime = function(time)
        {
            var hour = time.replace("1900/01/01 ", "");
            if (hour.length < 6)
                hour = hour + ':00'
            return hour;
        }
        //Check to see if the time changed and width of the component
        //we need to find the coordinates for the timeframes
        var rowIdx = savedMeeting.rowIndex;
        if (rowIdx == undefined || rowIdx == null)
            rowIdx = 0;
        if (rowIdx > agendaBuilderRow.rows.length - 1)
            rowIdx = agendaBuilderRow.rows.length - 1;
        me.fireEvent('meetingSaved', newRows);
        var savedAbsoluteRowIndex = null; //Find the spot the row is saved at
        var startShift = false; //tracks that a shift has started. There will only ever be on shift at a time in this method and it is down only

        //lets go through and make sure that all the meetings are on the proper dates and 
        //assign the row indexes. They can be on the wrong date due to drag
        var meetingWasRemoved = false; //this is used to detect when a meeting is removed; needed for moving from one date to the next
        for(var i = 0; i < me.dates.length; i++)
        {
            var d = me.dates[i];
            var vettedMeetings = [];             
            for(var j = 0; j < d.meetings.length; j++)
            {
                var m = d.meetings[j];
                //this makes sure that the meeting hasn't moved to another date
                if (me.areTwoDatesEqual(d.date, m.start))
                    vettedMeetings.push(m);   
                else
                    meetingWasRemoved = true;             
            }
            d.meetings = vettedMeetings;
            me.assignRowIndexes(d);
        }

        if (meetingWasRemoved)
            me.removeEmptyRows();

        var rowsAbove = 0;
        //This will handle shifting the meetings to the correct rows
        for(var i = 0; i < me.dates.length; i++)
        {
            var d = me.dates[i];
            var newRows = me.shiftMeetings(d, rowsAbove, me);   
            rowsAbove +=newRows;                                       
        }
        
        if (!postedData.start && postedData.date && postedData.start_time)
        {
            postedData.start = me.createDateWithTime(postedData.date, postedData.start_time);
        }
        if (!postedData.end && postedData.date && postedData.end_time)
            postedData.end = me.createDateWithTime(postedData.date, postedData.end_time);
        me.setAllRows24HourStatus();
        me.setAllRowCommentStatus();
        me.removeEmptyRows();
        postedData.meeting_item_type = scope.getMeetingType(postedData.type);
        postedData.room_setup_type = scope.getRoomSetup(postedData.room_setup);
        me.updateMeetingText(postedData.id, postedData.title, postedData.start, postedData.end, postedData.room_setup_type, postedData.num_people, me);
        me.fireEvent('meetingSaveComplete', postedData);
        if (me.queuedDates && me.queuedDates.length)
        {
            var dateInfo = me.queuedDates.shift();
            var id = dateInfo.meetingId;
            if (id == null)
                id = response.id;
            var baseMtg = me.getMeeting(id, me);
            me.saveQueueDate(dateInfo.date, baseMtg);
        }
        me.restoreLastY();
        me.unmask();
    },
    getTotalRowsInAboveDates : function(date)
    { 
        var me = this;
        var rowCount = 0;  
        for(var i = 0; i < me.agendaBuilderRows.length; i++)
        {  
            if (me.agendaBuilderRows[i].date < date)
            {
                var maxRow = me.agendaBuilderRows[i].rows.length + 1; //+ one for the divider
                rowCount += maxRow;
            }
        }
        return rowCount;
    },
    getCmpsAboveDateFirstRow : function(date)
    { 
        var me = this;
        var row = me.getRow(date);
        var firstRowId = row.rows[0].id;
        var index = 0;  
        var rowCnt = 0;
        var items = Ext.ComponentQuery.query('#datesCtr')[0].items.items;

        Ext.each(items, function(item){
            if (item.id == firstRowId)
                index = rowCnt
            rowCnt +=1;
        });
        
        return index;
    },
    /*
        instance represents the date with all the row structure in it
        shiftFromAbove represents shif that should occur to all meetings because there was a shift issued by above
     */
    shiftMeetings: function(instance, shiftFromAbove, scope){
        var me = scope;
        var lastMtg = instance.meetings[instance.meetings.length-1];
        
        var newRowCount = 0;
        if (lastMtg)
            newRowCount = lastMtg.rowIndex;
        var row = me.getRow(instance.date);
        //if we currently don't have as many rows as we do row indexes, we need to add one
        var rowsAdded = 0;
        if (newRowCount > row.rows.length)
        {
            var last_cmp = me.findMeetingComponent(lastMtg.id);
            if (last_cmp)
            {
                //for every row we add, we need to shift one down
                rowsAdded+=1;
                var rowsCountAbove = me.getCmpsAboveDateFirstRow(instance.date);
                var insertRowIndex = rowsCountAbove + row.rows.length;
                //Row count will be one more than the last index
                me.addAdditionalRow(instance.date, me, row, insertRowIndex);       
            }
        }

        for(var j = 0; j < instance.meetings.length; j++)
        {
            var m = instance.meetings[j];
            if (shiftFromAbove != 0)
            {
                me.moveMeetingUpXRows(m.id, Math.abs(shiftFromAbove), me);
            }
            var m_cmp = me.findMeetingComponent(m.id);
            if (m_cmp)
            {
                //we need to set the date for meetings dragged from one date to another
                m_cmp.date = instance.date;
            
                //the shift amount will represent any rows that should be on a different row than they currently are
                var amountToShift = m.rowIndex - m_cmp.getRelativeRow();       
                if (amountToShift < 0)
                {
                    me.moveMeetingUpXRows(m.id, Math.abs(amountToShift), me);
                }
                else if (amountToShift > 0)
                {
                    me.moveMeetingDownXRows(m.id, amountToShift, me);                
                }     
            }
        }        
        return rowsAdded;
    },
    setAllRows24HourStatus: function(){
        Ext.each(Ext.query('.agendaRowClass'), function(el){
            Ext.getCmp(el.id).setAllDayToMatchMeetings()
        });
    },
    setAllRowCommentStatus: function(){
        var me = this;
        for(var i = 0; i < me.dates.length; i++)
        {
            var d = me.dates[i];
            for(var j = 0; j < d.meetings.length; j++)
            {
                var m = d.meetings[j];
                var m_cmp = me.findMeetingComponent(m.id);
                if (m_cmp)
                {
                    if (m.note && m.note.length > 0)
                    {
                        m_cmp.addCls('mtg-instance-comment');
                    }
                    else
                    {
                        m_cmp.removeCls('mtg-instance-comment');
                    }
                }
            }
        }
    },
    findEmptyRows: function(){
        var me = this;
        var me = window.observer;
        var usedRows = [];
        //Find all the rows used by meetings
        Ext.each(me.dates, function(date){
            Ext.each(date.meetings, function(meeting){
                var m_cmp = me.findMeetingComponent(meeting.id);
                    if (m_cmp)
                    {
                        var currRow = m_cmp.getCurrentRow();
                        usedRows.push(currRow);
                    }

            })
        });
        var index = 1;
        var emtpyRows = [];
        var removeNextRowOnDate = null;
        //loop through all the rows and if there are any unused that are row 1 or 2, add them
        Ext.each(Ext.query('.agendaRowClass'), function(rowEl){
                var cmp = Ext.getCmp(rowEl.id);
                var dataField = cmp.dataField;
                if(dataField)
                {
                    var dateFromDataField = me.createDate(dataField);
                    //This row does not have an item on it
                    if (!usedRows.includes(index))
                    {
                        //We won't remove the first or second row
                        if (!cmp.isFirstRow() && !cmp.isSecondRow())
                        {
                            emtpyRows.push({
                                id: rowEl.id, 
                                index: index,
                                date : me.createDate(dataField)
                            });
                            removeNextRowOnDate = null;
                        }
                        //but if there is another row below it, we should remove it
                        //so lets flag it
                        else
                        {
                            removeNextRowOnDate = me.createDate(dataField);
                        }
                    }
                    else if (removeNextRowOnDate != null && removeNextRowOnDate.getDate && me.areTwoDatesEqual(removeNextRowOnDate, dateFromDataField))
                    {
                        if (!cmp.isFirstRow() && !cmp.isSecondRow())
                        {
                            emtpyRows.push({
                                    id: rowEl.id, 
                                    index: index,
                                    date : me.createDate(dataField)
                            });
                            removeNextRowOnDate = null;
                        }
                    }
                    index++;
                }
        });
        return emtpyRows;
    },
    removeEmptyRows: function(){
        var me = this;
        var emptyRows = me.findEmptyRows();
        if (emptyRows == null || !emptyRows.length)
        {
            me.setAllRows24HourStatus();
            me.setAllRowCommentStatus();
            return;
        }
        var hitRowWithTwo = false; //once we hit a row with only two, we stop
        Ext.each(emptyRows, function(emptyRow){
            Ext.each(me.dates, function(date){
                Ext.each(date.meetings, function(meeting){
                    var m_cmp = me.findMeetingComponent(meeting.id);
                    if (m_cmp)
                    {
                        var currRowIdx = m_cmp.getCurrentRow();
                        if (currRowIdx >= emptyRow.index)
                            me.moveMeetingUpXRows(meeting.id, 1, me);
                    }
                },me)
            }, me)
            var row = me.getRow(emptyRow.date);
            var cmpToRemove = Ext.getCmp(emptyRow.id);
            if (cmpToRemove)
            {
                cmpToRemove.hide();
                cmpToRemove.destroy();
                row.rows.splice(row.rows.length-1, 1)
            }
        });
            
        me.setAllRows24HourStatus();
        me.setAllRowCommentStatus();
    },
    onUpdateMeetingItemPeople: function(postedData, response, scope){
        var me = scope;
        me.updateMeetingText(postedData.id, postedData.title, postedData.start, postedData.end, postedData.room_setup_type, postedData.num_people, me);
    },
    onUpdateMeeting24Hours: function(postedData, response, scope){
        scope.fireEvent('meeting24HourUpdated', postedData);
    },
    onDeleteMeetingItem: function(data, response, scope){
        var me = scope;
        var id = data.id;
        scope.deleteMeeting(id, scope);
        scope.fireEvent('meetingItemDeleted', id);
        me.removeEmptyRows();
    },
    onSaveAlternateOptions: function(obj, scope){},
    onSavePrePostDays: function(obj, scope){
        var me = this;
        if (scope)
            me = scope;
        if (me && me.fireEvent)
            me.fireEvent('prePostDaysSaved', obj);
    },
    /*******************Ajax calls */ 
    getRoomSetups: function(){
        this.ajaxController.getRoomSetups(this.onGetRoomSetups, this);
    },
    getMeetingItemTypes: function(){
        this.ajaxController.getMeetingItemTypes(this.onGetMeetingItemTypes, this);
    },
    getMeetingItems: function(){
        this.ajaxController.getMeetingItems(this.onGetMeetingItems, this);
    },
    saveMeetingItem: function(meeting){
        var me = this;
        var instance = me.getInstance(meeting.date, me);
        if (instance == null)
            throw("Instance not found");
        meeting.room_night = instance.room_night;
        meeting.room_block = instance.room_block;
        if (meeting.room_night == undefined || meeting.room_night == null)
            throw ("room night must be provided");
        if (meeting.room_block == undefined || meeting.room_block == null)
            throw ("room block must be provided");
        if (meeting.start_time.length < 6)
            meeting.start_time = meeting.start_time + ":00";
        if (meeting.end_time.length < 6)
            meeting.end_time = meeting.end_time + ":00";
        me.mask();
        me.recordCurrentY();
        me.ajaxController.saveMeetingItem(meeting, me.onSaveMeetingItem, me);
    },
    getInstance: function(d, scope)
    {
        var me = scope;
        var instance = null;
        Ext.each(me.dates, function(i){
            if (i.date && d && me.areTwoDatesEqual(i.date, d))
            {
                instance = i;                    
            }
        });
        return instance;
    },
    saveQueueDate: function(d, meeting){
        var me = this;
            var instance = me.getInstance(d, me);
            var newMtg = {
                all_day : meeting.all_day,
                booths  : meeting.booths,
                date    : d,
                end_time: meeting.end_time,
                meeting_item_type: meeting.meeting_item_type,
                note    : meeting.note,
                num_people: meeting.num_people,
                posters : meeting.posters,
                room_setup: meeting.room_setup,
                room_setup_type: meeting.room_setup_type,
                square_feet: meeting.square_feet,
                start_time: meeting.start_time,
                tabletops: meeting.tabletops,
                title   : meeting.title,
                type    : meeting.type,
                id      : null,
                oldRowIndex: 1
            };
            var start = meeting.start_time.replace('1900/01/01 ', '');
            while (start.indexOf("1900") >= 0)
                start = meeting.start_time.replace('1900/01/01 ', '');
            var end = meeting.end_time.replace('1900/01/01 ', '');
            while (end.indexOf("1900") >= 0)
                end = meeting.end_time.replace('1900/01/01 ', '');
            if (start.length < 6)
                start = start + ':00';
            if (end.length < 6)
                end = end + ':00';
            newMtg.start_time =  start;
            newMtg.end_time =  end;
           
            me.saveMeetingItem(newMtg);         

            var listenerid = me.localListeners.length;
            me.localListeners.push({
                id      : listenerid,
                fired   : false,
                listener:  me.on('meetingSaveStart', function(result)
                {
                    var myListener = me.localListeners[listenerid];
                    if (!myListener || myListener.fired)
                        return;
                    myListener.fired = true;
                    newMtg = result.postedData;
                    newMtg.id = result.newId;
                    instance.meetings.push(newMtg);
                    me.assignRowIndexes(instance);
                    var color = "#" + meeting.meeting_item_type.color;
                    var idx = me.calculateRowIndex(newMtg, instance);
                
                    var agendaBuilderRow = me.getRow(instance.date);
                    var rowsAbove = me.getCmpsAboveDateFirstRow(instance.date);
                    var lastIdx = idx;
                    Ext.each(instance.meetings, function(Imtg){
                        if (Imtg.rowIndex > lastIdx)
                            lastIdx = Imtg.rowIndex;
                    })
                    
                    if (idx < 2) //We can't add to the first two rows
                        idx = 2;

                    var insertAt = rowsAbove + idx;
                    //We need to add a row if this is true
                    if (agendaBuilderRow.rows.length <= idx)
                        me.addAdditionalRow(instance.date, me, agendaBuilderRow, insertAt);
                    me.createMeeting(newMtg.id, instance.date, start, end, meeting.title, 'white', 
                            color, idx, me, meeting.meeting_item_type);
                }, me)});   
            
    },
    queueAdditionalDatesToSave: function(copyToDates, meeting, scope)
    {
        var me = scope;
        me.queuedDates = [];
        Ext.each(copyToDates, function(d){
            me.queuedDates.push({
                date: d,
                meetingId: meeting.id
            })
        })
    },
    updateMeetingItemPeople: function(meetingId, numPeople, scope){
        var me = scope;
        var mtg = me.getMeeting(meetingId, me);
        if (!mtg)
            throw("Meeting not found");
        mtg.num_people = numPeople;
        this.ajaxController.saveMeetingItem(mtg, this.onUpdateMeetingItemPeople, this);
    },
    updateMeeting24Hours: function(meetingId, scope){
        var me = scope;
        var mtg = me.getMeeting(meetingId, me);
        if (!mtg)
            throw("Meeting not found");
        mtg.all_day = !mtg.all_day;
        this.ajaxController.saveMeetingItem(mtg, this.onUpdateMeeting24Hours, this);
    },
    deleteMeetingItem: function(id){
        Ext.Msg.show({
            title:'Confirm Delete',
            message: 'This will permanently delete this event. Are you sure?',
            closable : false,
            buttons : Ext.Msg.YESCANCEl,
            buttonText : 
            {
                yes : 'Yes',
                cancel : 'Cancel'
            },
            icon: Ext.Msg.QUESTION,
            scope: this,
            fn : function(buttonValue, inputText, showConfig){
                if (buttonValue == 'yes')
                    this.ajaxController.deleteMeetingItem(id, this.onDeleteMeetingItem, this);
            }
        });
        
    },
    saveAlternateOption: function(){},
    savePrePostDays: function(type, count){
        this.ajaxController.savePrePostDays(type, count, this.onSavePrePostDays, this);
    },
    getColForHour: function(hour){
        if (hour == '06:00:00')
            return 3;
        else if (hour == '06:30:00')
            return 4;
        else if (hour == '07:00:00')
            return 5;
        else if (hour == '07:30:00')
            return 6;
        else if (hour == '08:00:00')
            return 7;
        else if (hour == '08:30:00')
            return 8;
        else if (hour == '09:00:00')
            return 9;
        else if (hour == '09:30:00')
            return 10;
        else if (hour == '10:00:00')
            return 11;
        else if (hour == '10:30:00')
            return 12;
        else if (hour == '11:00:00')
            return 13;
        else if (hour == '11:30:00')
            return 14;
        else if (hour == '12:00:00')
            return 15;
        else if (hour == '12:30:00')
            return 16;
        else if (hour == '13:00:00')
            return 17;
        else if (hour == '13:30:00')
            return 18;
        else if (hour == '14:00:00')
            return 19;
        else if (hour == '14:30:00')
            return 20;
        else if (hour == '15:00:00')
            return 21;
        else if (hour == '15:30:00')
            return 22;
        else if (hour == '16:00:00')
            return 23;
        else if (hour == '16:30:00')
            return 24;
        else if (hour == '17:00:00')
            return 25;
        else if (hour == '17:30:00')
            return 26;
        else if (hour == '18:00:00')
            return 27;
        else if (hour == '18:30:00')
            return 28;
        else if (hour == '19:00:00')
            return 29;
        else if (hour == '19:30:00')
            return 30;
        else if (hour == '20:00:00')
            return 31;
        else if (hour == '20:30:00')
            return 32;
        else if (hour == '21:00:00')
            return 33;
        else if (hour == '21:30:00')
            return 34;
        else if (hour == '22:00:00')
            return 35;
        else if (hour == '22:30:00')
            return 36;
        else if (hour == '23:00:00')
            return 37;
        else if (hour == '23:30:00')
            return 38;
        else 
            return 39;            
    },
    executeOverrides: function(){
        /**************Overrides */
        Ext.override(Ext.dom.Element, {
        setStyle: function(prop, value) {
            if (!this || !this.dom) // BAD EXTJS... You didn't null check for destroyed elements that haven't purged from the dom
            {
                if (this.destoyed)
                {
                    var p = this.parent;                    
                }
                return;
            }
                    var me = this,
                        dom = me.dom,
                        hooks = me.styleHooks,
                        style = dom.style,
                        name = prop,
                        hook;
                    // we don't promote the 2-arg form to object-form to avoid the overhead...
                    if (typeof name === 'string') {
                        hook = hooks[name];
                        if (!hook) {
                            if (Element && Element.normalize)
                                hooks[name] = hook = {                                
                                    name: Element.normalize(name)
                                };
                        }
                        value = (value == null) ? '' : value;
                        // map null && undefined to ''
                        if (hook && hook.set) {
                            hook.set(dom, value, me);
                        } else if (hook) {
                            style[hook.name] = value;
                        }
                        if (hook && hook.afterSet) {
                            hook.afterSet(dom, value, me);
                        }
                    } else {
                        for (name in prop) {
                            if (prop.hasOwnProperty(name)) {
                                hook = hooks[name];
                                if (!hook && Element && Element.normalize) {
                                    hooks[name] = hook = {
                                        name: Element.normalize(name)
                                    };
                                }
                                value = prop[name];
                                value = (value == null) ? '' : value;
                                // map null && undefined to ''
                                if (hook)
                                {
                                    if (hook.set) {
                                        hook.set(dom, value, me);
                                    } else {
                                        style[hook.name] = value;
                                    }
                                    if (hook.afterSet) {
                                        hook.afterSet(dom, value, me);
                                    }
                                }
                            }
                        }
                    }
                    return me;
            },
            translateXY: function(x, y) {
                if (!this.el || this.destroyed)
                    return{
                        x:0,
                        y:0
                    };
                var me = this,
                    el = me.el,
                    styles = el.getStyle(me._positionTopLeft),
                    relative = styles.position === 'relative',
                    left = parseFloat(styles.left),
                    top = parseFloat(styles.top),
                    xy = me.getXY();
                if (Ext.isArray(x)) {
                    y = x[1];
                    x = x[0];
                }
                if (isNaN(left)) {
                    left = relative ? 0 : el.dom.offsetLeft;
                }
                if (isNaN(top)) {
                    top = relative ? 0 : el.dom.offsetTop;
                }
                left = (typeof x === 'number') ? x - xy[0] + left : undefined;
                top = (typeof y === 'number') ? y - xy[1] + top : undefined;
                return {
                    x: left,
                    y: top
                };
            },
            setXY: function(xy) {
                if (!this.dom || this.destroyed)
                    return me;
                var me = this,
                    pts = me.translatePoints(xy),
                    style = me.dom.style,
                    pos;
                me.position();
                // right position may have been previously set by rtlSetLocalXY 
                // so clear it here just in case.
                style.right = 'auto';
                for (pos in pts) {
                    if (!isNaN(pts[pos])) {
                        style[pos] = pts[pos] + 'px';
                    }
                }
                if (me.shadow || me.shim) {
                    me.syncUnderlays();
                }
                return me;
            },
            syncUnderlays: function() {
                var me = this,
                    shadow = me.shadow,
                    shim = me.shim,
                    dom = me.dom,
                    xy, x, y, w, h;
                if (me.isVisible()) {
                    xy = me.getXY();
                    x = xy[0];
                    y = xy[1];
                    w = dom.offsetWidth;
                    h = dom.offsetHeight;
                    if (shadow && !shadow.hidden && !shadow.destroyed && shadow.el && !shadow.el.destroyed) {
                        shadow.realign(x, y, w, h);
                    }
                    if (shim && !shim.hidden && !shadow.destroyed) {
                        shim.realign(x, y, w, h);
                    }
                }
            }
        });

        Ext.override(Ext.Container, {
            translateXY: function(x, y) {
                if (!this.el)
                    return;
                this.callSuper(x, y);
            },
            getCenterXY: function(){
                    var me = this;
                    if (me && me.getViewRegion && Ext.isFunction(me.getViewRegion))
                    {
                        var viewRegion = me.getViewRegion();
                        var x = (viewRegion.right + viewRegion.left) / 2;
                        var y = (viewRegion.top + viewRegion.bottom) / 2;
                        return {x: x, y: y};
                    }

                    return null;
            }
        })

        Ext.override(Ext.Component, {
            translateXY: function(x, y) {
                if (!this.el)
                    return;
                this.callSuper(x, y);
            },
            getCenterXY: function(){
                    var me = this;
                    if (me && me.getViewRegion && Ext.isFunction(me.getViewRegion))
                    {
                        var viewRegion = me.getViewRegion();
                        var x = (viewRegion.right + viewRegion.left) / 2;
                        var y = (viewRegion.top + viewRegion.bottom) / 2;
                        return {x: x, y: y};
                    }

                    return null;
            }
        })

        
        Ext.override(Ext.dom.Shadow, {
            beforeShow: function() {
                if (!this || !this.dom) // BAD EXTJS... You didn't null check for destroyed elements that haven't purged from the dom
                {
                    return;
                }
                this.callSuper();
            }
        })
        

        Ext.override(Ext.dom.Underlay, {
            show: function() {
                    var me = this,
                        target = me.target,
                        zIndex = me.zIndex,
                        el = me.el,
                        insertionTarget = me.getInsertionTarget().dom,
                        dom;
                    if (!el) {
                        el = me.el = me.getPool().checkOut();
                    }
                    if (el.destroyed)
                        return;                    
                    me.beforeShow();
                    if (zIndex == null) {
                        // For best results, we need the underlay to be as close as possible to its
                        // target element in the z-index stacking order without overlaying the target
                        // element.  Since the UnderlayPool inserted the underlay as high as possible
                        // in the dom tree when we checked the underlay out of the pool, we can assume
                        // that it comes before the target element in the dom tree, and therefore can
                        // give it the exact same index as the target element.
                        zIndex = (parseInt(target.getStyle("z-index"), 10));
                    }
                    if (zIndex) {
                        el.setStyle("z-index", zIndex);
                    }
                    // Overlay elements are shared, so fix position to match current owner
                    el.setStyle('position', me.fixed ? 'fixed' : '');
                    dom = el.dom;
                    if (dom && dom.nextSibling && dom.nextSibling !== insertionTarget) {
                        // inserting the underlay as the previous sibling of the target ensures that
                        // it will show behind the target, as long as its z-index is less than or equal
                        // to the z-index of the target element.
                        target.dom.parentNode.insertBefore(dom, insertionTarget);
                    }
                    el.show();
                    me.realign();
                    me.hidden = false;
                },
            hide: function() {
                var me = this,
                    el = me.el;
                if (el && !el.destroyed) {
                    el.hide();
                    me.getPool().checkIn(el);
                    me.el = null;
                    me.hidden = true;
                }
            }
        })
        
        Ext.override(Ext.layout.Layout, {
            getItemLayoutEl: function(item) {
                var dom = item.el ? item.el.dom : Ext.getDom(item);
                if (!dom)
                    return;
                var parentNode = dom.parentNode;
                var className = null;
                if (parentNode) {
                    className = parentNode.className;
                    if (className && className.indexOf(Ext.baseCSSPrefix + 'resizable-wrap') !== -1) {
                        dom = dom.parentNode;
                    }
                }
                return dom;
            }

        });

        //handling missing support for IE 11
        if (Ext.isIE && document.msElementsFromPoint && !document.elementsFromPoint)
        {
            document.elementsFromPoint = function(x, y)
            {
                return document.msElementsFromPoint(x, y);
            }
        }   
        //IE Work around for chars added to data attributes
        String.prototype.stripInvalidChars = function() 
        {
            var str = this;
            var out = "";
            for (var step = 0; step < str.length; step++) {
                if (str.charCodeAt(step) != 8206) 
                    out = out + str.charAt(step);
            }
            return out;
        }

        String.prototype.adjustMidnight = function()
        {
            var str = this;
            str = str.replace('00:00:00', '23:59:00');
            return str;
        }

        //IE missing contains
        if (!Array.prototype.includes) {
            Object.defineProperty(Array.prototype, 'includes', {
                value: function(searchElement, fromIndex) {

                // 1. Let O be ? ToObject(this value).
                if (this == null) {
                    throw new TypeError('"this" is null or not defined');
                }

                var o = Object(this);

                // 2. Let len be ? ToLength(? Get(O, "length")).
                var len = o.length >>> 0;

                // 3. If len is 0, return false.
                if (len === 0) {
                    return false;
                }

                // 4. Let n be ? ToInteger(fromIndex).
                //    (If fromIndex is undefined, this step produces the value 0.)
                var n = fromIndex | 0;

                // 5. If n ≥ 0, then
                //  a. Let k be n.
                // 6. Else n < 0,
                //  a. Let k be len + n.
                //  b. If k < 0, let k be 0.
                var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

                // 7. Repeat, while k < len
                while (k < len) {
                    // a. Let elementK be the result of ? Get(O, ! ToString(k)).
                    // b. If SameValueZero(searchElement, elementK) is true, return true.
                    // c. Increase k by 1.
                    // NOTE: === provides the correct "SameValueZero" comparison needed here.
                    if (o[k] === searchElement) {
                    return true;
                    }
                    k++;
                }

                // 8. Return false
                return false;
                }
            });
        }
    }
    
});



