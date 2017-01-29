Ext.ns('AgendaBuilder');

Ext.define('AgendaBuilderObservable', {
    version: '1.001',
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
    ajaxController: null,
    currentDragMtg: null, //This is used to target when item is current being dragged
    initAjaxController: function(url, scope){
        var me = scope;
        me.ajaxController = Ext.create('AjaxController', {
            rfpNumber: me.rfpNumber,
            ajaxUrlBase: url
        })
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
    createMeetingTemplateComponent: function(m){
            var t = new Ext.Template(
                        '<div>',
                            '<img class="grabBars" src="app/images/grabBars.png">',
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
        
        var date = new Date(instance.date)
        var dateStr = Ext.Date.format(date, "m/d/Y");
        var offset = Ext.Date.format(date, 'P');
        var zone = Ext.Date.format(date, 'T');
        Ext.each(instance.meetings, function(m){
            m.start = new Date(m.start_time.replace('1900/01/01', dateStr) + ' ' + zone + offset);
            m.end = new Date(m.end_time.replace('1900/01/01', dateStr) + ' ' + zone + offset);
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
        for(i = 0; i < instance.meetings.length; i++)
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
        me.savePrePostDays('pre', count);
        Ext.ComponentQuery.query('#datesCtr')[0].removeAll();
        me.removeAllMeetings();
        var firstDate = me.dates[0].date;
        var newRows = [];
        for(i = 1; i <= count; i++)
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
        me.agendaBuilderRows = [];
        me.dates = [];
        me.buildDates(newRows);
    },
    addPostDays: function(count){
        var me = this;
        me.savePrePostDays('post', count);
        Ext.ComponentQuery.query('#datesCtr')[0].removeAll();
        me.removeAllMeetings();        
        var lastDate = me.dates[me.dates.length - 1].date;
        var newRows = [];
        Ext.each(me.dates, function(d){
            newRows.push(d);
        })
        for(i = 1; i <= count; i++)
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
                        {html: '-Collapse', cls: 'hideARow link-color ltFont', style : 'text-align: center !important;height: 42px; float:left !important; padding-left:3px;', Index: 0},
                        {html: '', style: '', cls: '', Index: 1},
                        {html: '', style : 'background-color:grey !important;', Index: 38  }
                        ]
                });
            parentCtr.add(bottomRow);
            

            agendaBuilderRow.rows.push({id: topRow.id});
            agendaBuilderRow.rows.push({id: bottomRow.id});
            this.agendaBuilderRows.push(agendaBuilderRow);
            for(j = 2; j < agendaBuilderRow.rowCount; j++)
            {
                me.addAdditionalRow(instance.date, me, agendaBuilderRow);
            }

            var dvdr = Ext.create('AgendaRow', 
                {
                    height: 1,
                    defaultColStyle:'border-bottom: 1px solid black !important;'
                });
            parentCtr.add(dvdr);
    },
    removeAllMeetings: function(){
        Ext.each(Ext.query('.mtg-instance'), function(el){
            Ext.fly(el).destroy()
        })
    },
    addAdditionalRow: function(date, context, agendaBuilderRow, insertRowAt, relativeIndex, rowsAbove){
        //We can not add a new row at index 0 or 1 because of the left hand items of dates and -Collapse
        if (insertRowAt != undefined && (insertRowAt == 0 || insertRowAt == 1))
            insertRowAt = 2;
        else if (insertRowAt != undefined && relativeIndex != undefined && rowsAbove != undefined && rowsAbove != 0 && (
            relativeIndex == 0 || relativeIndex == 1))
            insertRowAt = rowsAbove + 3;
        if (context)
            var me = context;
        else
            var me = this;
        //The insert point is always one less than the row index ie... insert at 9 needs to check the row with the index of 8 (0-8)
        //we can't insert in the first two rows. They are reserved
        var currRow = me.getRowAt(insertRowAt - 1);
        if (currRow != null && currRow.isFirstRow())
        {
            insertRowAt++;
            currRow = me.getRowAt(insertRowAt - 1);
        }
        if (currRow != null && currRow.isSecondRow())
        {
            insertRowAt++;
        }

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
        for(i = 0; i < cnt; i++)
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
        el.addEventListener('mouseover', function(mouseEvent){
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
            me.showDragDropHourPreview(endingRight, mouseEvent.pageY + 40, 
                me.convertTimeTo12Hrs(startingHour),me.convertTimeTo12Hrs(endingHour), me)
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
                                                        targetCmp.observer.showMeetingEditor(mtg, targetCmp.observer, mtg.meeting_item_type, mtg.date);
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
            listeners: {
                delay: 100,
                afterrender: function(cmp) {
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
                        cmp.observer.showMeetingEditor(mtg, cmp.observer, mtg.meeting_item_type, mtg.date);
                    })

                    cmp.mon(cmp.el, 'mousedown', function(e){
                        		var overrides = {
                                    // Called the instance the element is dragged.
                                        b4StartDrag : function() {
                                            observer.currentDragMtg = cmp; //Used to track the cmp being dragged
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
                                        // onDragEnter: function(e, id) { 
                                        //     //Leaving the reference here so devs know. OnDragEnter will not fireEvent
                                        //     //when resizing
                                        // },
                                        // Called when the drag operation completes
                                        endDrag : function(dropTarget) {
                                            observer.currentDragMtg = null; //Drag is over, so don't track it.
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
                                            if (browserEvent == null)
                                            {
                                                throw("Cannoth find browserEvent");									
                                            }
                                            var x = browserEvent.clientX;
                                            var y = browserEvent.clientY;
                                            //console.dir(document.elementsFromPoint(newCmp.getX(), y));								
                                            Ext.each(document.elementsFromPoint(x, y), function(el){
                                                if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
                                                    match = el;
                                            })
                                            var instance = null;
                                            if (match && match.dataset && match.dataset.date)
                                            {
                                                var instanceDate = new Date(match.dataset.date);
                                                instance = observer.getInstance(instanceDate, observer);
                                            }
                                            
                                            var invalidDrop = function(){
                                                cmp.el.removeCls('dropOK');
                                                cmp.setX(cmp.origX);
                                                cmp.setY(cmp.origY);
                                                delete cmp.invalidDrop;
                                                delete cmp.origX;
                                                delete cmp.origY;
                                            }
                                            // Invoke the animation if the invalidDrop flag is set to true
                                            if (match == null || !match.dataset || !match.dataset.date || !match.dataset.hour || (
                                                instance && instance.visible == false)) {
                                                // Remove the drop invitation
                                                invalidDrop();
                                            }
                                            else{
                                                var d = new Date(match.dataset.date);
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
                                                if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
                                                    matchingEl = el;
                                                })
                                                var end = (matchingEl.dataset.hour);
                                                if (!end)
                                                {
                                                    end = "00:00:00";                            
                                                }
                                                var mtg = cmp.observer.getMeeting(cmp.meetingId, cmp.observer);
                                                var dimensions = cmp.observer.getDimensionsByRowIndex(rowIndex, start, end);
                                                if (!dimensions)
                                                {
                                                    invalidDrop();
                                                    return;
                                                }
                                                var m_cmp = cmp.observer.findMeetingComponent(mtg.id);
                                                m_cmp.setX(dimensions.xy[0]);
                                                //m_cmp.setWidth(dimensions.width);
                                                m_cmp.setY(dimensions.xy[1] + 3);
                                                
                                                if (mtg.start_time.replace('1900/01/01 ', '') == start &&
                                                    mtg.end_time.replace('1900/01/01 ', '') == end)
                                                    return;
                                                mtg.start_time = start;
                                                mtg.end_time = end;
                                                mtg.date = d;
                                                cmp.observer.saveMeetingItem(mtg);
                                                var listener = cmp.observer.on({
                                                    meetingSaveComplete : function(){
                                                        cmp.observer.removeEmptyRows();
                                                        listener.destroy();
                                                    },
                                                    scope: cmp.observer
                                                })
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
                    
                                    dd.DDMInstance.stopEvent(e);
                    });
                    cmp.observer.monitorMeetingHandle(cmp);

                    //This is the function to save the hour changes via a resize event
                    cmp.saveHourChange = function(){
                        cmp.resizeRunner.stop();
                        var match = null;
                        var rect = cmp.el.dom.getBoundingClientRect();
                        var y = (rect.top + rect.bottom) / 2; //We'll get the center

                        //Now let's  find the starting timeslot
                        var startingPoint = rect.left + 1; //shifted one pixel to make sure we are on the starting block                       
                        Ext.each(document.elementsFromPoint(startingPoint, y), function(el){
                        if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
                            match = el;
                        })
                        if (match == null)
                            throw('error finding match in date');
                        var start = (match.dataset.hour)
                        if (!start)
                            start = '06:00:00';
                        var endingPoint = rect.right + 10;// - 1; //shifted one pixel to make sure we are on the ending point
                        Ext.each(document.elementsFromPoint(endingPoint, y), function(el){
                        if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
                            match = el;
                        })
                        var end = (match.dataset.hour);
                        var mtg = cmp.observer.getMeeting(cmp.meetingId, cmp.observer);
                        if (!end)
                        {
                            end = "00:00:00";                            
                        }
                        var date = mtg.date;
                        if (!date)
                            date = new Date(match.dataset.date);                            
                        var dimensions = me.getDimensions(mtg.rowIndex -1, date, start, end);
                        var m_cmp = me.findMeetingComponent(mtg.id);
                        m_cmp.setX(dimensions.xy[0]);
                        m_cmp.setWidth(dimensions.width);
                        if (mtg.start_time.replace('1900/01/01 ', '') == start &&
                            mtg.end_time.replace('1900/01/01 ', '') == end)
                            return;
                        mtg.start_time = start;
                        mtg.end_time = end;
                        mtg.date = new Date(match.dataset.date);
                        cmp.observer.saveMeetingItem(mtg);
                    }

                    var runner = new Ext.util.TaskRunner();
                    cmp.resizeRunner = runner.newTask({
                        run: function() {
                            cmp.saveHourChange();
                        },
                        interval: 1000 // 1-minute interval
                    });
                    cmp.on({
                        resize: function(cmp, width, height, oldwidth, oldheight, opts){
                            //we'll reset the task each time so while a drag is still going on
                            //we won't start the save. more than a second will be detected as a save change end
                            cmp.resizeRunner.stop();
                            cmp.resizeRunner.start();
                            if (!width || !oldwidth)
                                return;
                            Ext.each(cmp.observer.meetingCallouts, function(callout){
                                callout.hide();
                            })
                        }
                    });
                    cmp.mon(cmp.el, 'mouseup', function(){
                        cmp.saveHourChange();
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
        var date = new Date(source.date)
        var dateStr = Ext.Date.format(date, "m/d/Y");
        var start = new Date(dateStr + " " + source.start_time.replace('1900/01/01 ', '') + ' GMT+0000');
        var end = new Date(dateStr + " " + source.end_time.replace('1900/01/01 ', '') + ' GMT+0000');
        Ext.each(scope.dates, function(instance){
            if (instance.date && source.date && instance.date.getDate() == source.date.getDate() && instance.date.getMonth() == source.date.getMonth())
            {
                Ext.each(instance.meetings, function(meeting){
                    var overLaps = end <= meeting.end && start >= meeting.start;
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
    showMeetingEditor: function(meeting, observer, meetingTemplate, date){
        var me = this;
        var datesCtr = Ext.ComponentQuery.query('#MainContainer')[0];
        Ext.create('MeetingEditor', {
            meeting: meeting,
            alignTarget: datesCtr,
            observer: observer,
            meetingTemplate: meetingTemplate,
            date: date
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
        if (hr == 12 && min == '00')
            slice = 'PM';
        var v  = Ext.String.format("{0}:{1} {2}", hr, min, slice);
        return v;
    },
    convertTimeTo24Hrs: function(time){
        time = time.toUpperCase()
        var hours = Number(time.match(/^(\d+)/)[1]);
        var minutes = Number(time.match(/:(\d+)/)[1]);
        if(time.indexOf('PM') != -1 && hours<12) hours = hours+12;
        if(time.indexOf('AM') != -1 && hours==12) hours = hours-12;
        var sHours = hours.toString();
        var sMinutes = minutes.toString();
        if(hours<10) sHours = "0" + sHours;
        if(minutes<10) sMinutes = "0" + sMinutes;
        return sHours + ":" + sMinutes;
    },
    getDisplayHours : function(time){
            if (!time)
                return '';
                var hours = time.getHours();
                var minutes = time.getMinutes();
                var amPm = "AM"
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
                date: new Date(data.date),
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
        var agendaBuilderRow = me.getRow(postedData.date);
        if (agendaBuilderRow == null)
            throw "Row Not found";
        var newRows = [];
        var savedMeeting = {};
        //Create a new meeting since it has not id
        if (!postedData.id)
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
            Ext.apply(savedMeeting, postedData);              
        }
        //update the meeting data with the saved info or create  a new entry
        Ext.each(scope.dates, function(instance){
            if (postedData.date.getDate() == instance.date.getDate() && postedData.date.getMonth() == instance.date.getMonth())
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
        scope.fireEvent('meetingSaved', newRows);
        var savedAbsoluteRowIndex = null; //Find the spot the row is saved at
        var startShift = false; //tracks that a shift has started. There will only ever be on shift at a time in this method and it is down only
        for(i = 0; i < scope.dates.length; i++)
        {
            var d = scope.dates[i];
            var row = me.getRow(d.date);
            var results = me.shiftMeetings(d.meetings, d.date, row, me.dates, postedData.id, savedAbsoluteRowIndex, startShift, me);
            startShift = results.startShift;
            savedAbsoluteRowIndex = results.savedAbsoluteRowIndex;  
            me.setAllRows24HourStatus();
        }
        me.updateMeetingText(postedData.id, postedData.title, postedData.start, postedData.end, postedData.room_setup_type, postedData.num_people, me);
        scope.fireEvent('meetingSaveComplete', newRows);
    },
    getTotalRowsInAboveDates : function(rowIndex, dates, observer)
    { 
        var rowCount = 0;  
        for(i = 0; i < rowIndex; i++)
        {  
            var maxRow = observer.getMaxRowsForDate(dates[i].meetings);
            rowCount += maxRow;
        }
        return rowCount;
    },
    shiftMeetings: function(meetings, date, row, dates, savedMtgId, savedAbsoluteRowIndex, startShift, scope){
        var me = scope;
        
        var rowsNeeded = me.getMaxRowsForDate(meetings);//decrement one because we need the base 0 count
        var totalRowsAbove = null;
        var relativeIdx = null;
        //we are only going to keep looking for the savedAbsoluteRowIndex
        //while we dont have it.
        if (savedAbsoluteRowIndex == null)
            Ext.each(meetings, function(mtg){
                var rowsAbove = me.getTotalRowsInAboveDates(row.rowIndex, dates, me);
                if (mtg.id == savedMtgId)
                {
                    relativeIndex = row.rowIndex;
                    totalRowsAbove =  me.getTotalRowsInAboveDates(row.rowIndex, dates, me);
                    savedAbsoluteRowIndex = mtg.rowIndex + totalRowsAbove;
                    var oldidx = (mtg.oldRowIndex ? mtg.oldRowIndex : 1); //if there is an old row index we use it, otherwise it is new and starts on row 1
                    var shiftAmount = mtg.rowIndex - oldidx;
                    var m_cmp = me.findMeetingComponent(mtg.id);
                    if (shiftAmount == 0)
                        shiftAmount = ((mtg.rowIndex - (m_cmp.getCurrentRow() - totalRowsAbove)));
                    if (shiftAmount > 0)    
                    {
                        me.moveMeetingDownXRows(mtg.id, shiftAmount, me);
                    }
                    else if (shiftAmount < 0)
                    {
                        savedAbsoluteRowIndex = null;
                        shiftAmount = 0;
                    }
                }
        })
        if (row.rowCount < rowsNeeded)
        {
            var insertRowAt = savedAbsoluteRowIndex - 1;
            var rowCmp = me.getRowAt(insertRowAt);
            //we can't insert at the first or second row of the date
            if (rowCmp && (rowCmp.isFirstRow()))
            {
                insertRowAt = rowCmp.getRowIndex() + 1;  
                rowCmp = me.getRowAt(insertRowAt);
            }
            if (rowCmp && (rowCmp.isSecondRow()))
            {
                insertRowAt = rowCmp.getRowIndex() + 1;
            }
            var x = me.addAdditionalRow(date, me, row, insertRowAt, relativeIndex, totalRowsAbove);   
            row.rowCount +=1;
            startShift = true;                      
        } 

        if (startShift)
        {
            var rowsAbove = me.getTotalRowsInAboveDates(row.rowIndex, dates, me);
            Ext.each(meetings, function(mtg){
                if ((mtg.rowIndex + me.getTotalRowsInAboveDates(row.rowIndex, dates, me) > savedAbsoluteRowIndex))
                    me.moveMeetingDownXRows(mtg.id, 1, me);
            })
        }
        return {
            startShift: startShift,
            savedAbsoluteRowIndex: savedAbsoluteRowIndex
        };
    },
    setAllRows24HourStatus: function(){
        Ext.each(Ext.query('.agendaRowClass'), function(el){
            Ext.getCmp(el.id).setAllDayToMatchMeetings()
        });
    },
    findEmptyRow: function(){
        var me = this;
        var gap = null;
        var dateOfGap = null;
        var lastRow = 0;
        var rows = [];
        //loop through all the rowindexes and check for a gap between them
        Ext.each(me.dates, function(date){
            Ext.each(date.meetings, function(meeting){
                var m_cmp = me.findMeetingComponent(meeting.id);
                if (m_cmp)
                {
                    var currRow = m_cmp.getCurrentRow();
                    rows.push(currRow);
                    if (currRow >= lastRow && ((currRow - lastRow) > 1))
                    {
                        gap = lastRow + 1;
                        dateOfGap = date.date;
                    }
                    lastRow = m_cmp.getCurrentRow();
                }
            },me)
        }, me)
        if (rows.includes(gap))
            gap = null;
        if (gap != null)
            return {index : gap, date: dateOfGap};
        //we will need to check the very last row to see if everything works out
        //if the last row index isn't the same as the last meet row index, there isn't a gap because it is
        //the last sequence but it is missing.
        if (lastRow != null)
        {
            var lastRowId = me.agendaBuilderRows[me.agendaBuilderRows.length-1].rows[me.agendaBuilderRows[me.agendaBuilderRows.length-1].rows.length - 1].id
            var agendaBuilderRow = Ext.getCmp(lastRowId);
            if (agendaBuilderRow)
            {
                var lastRowIndex = agendaBuilderRow.getRowIndex();
                dateOfGap = new Date(agendaBuilderRow.dataField);
                if (lastRow != lastRowIndex)
                    gap = lastRowIndex;
            }
        }
        if (gap == null)
            return null;
        return {index : gap, date: dateOfGap};;
    },
    removeEmptyRows: function(){
        var me = this;
        var emptyRow = me.findEmptyRow();
        if (emptyRow == null)
            return;
        Ext.each(me.dates, function(date){
            Ext.each(date.meetings, function(meeting){
                var m_cmp = me.findMeetingComponent(meeting.id);
                if (m_cmp)
                {
                    var currRowIdx = m_cmp.getCurrentRow();
                    if (currRowIdx > emptyRow.index)
                        me.moveMeetingUpXRows(meeting.id, 1, me);
                }
            },me)
        }, me)

        var row = me.getRow(emptyRow.date);
        if (row && row.rows && row.rows.length > 2)
        {
            var idToRemove = row.rows[row.rows.length - 1].id;
            var cmpToRemove = Ext.getCmp(idToRemove);
            if (cmpToRemove)
            {
                cmpToRemove.hide();
                cmpToRemove.destroy();
            }
        }
    },
    onUpdateMeetingItemPeople: function(postedData, response, scope){
        var me = scope;
        me.updateMeetingText(postedData.id, postedData.title, postedData.start, postedData.end, postedData.room_setup_type, postedData.num_people, me);
    },
    onUpdateMeeting24Hours: function(postedData, response, scope){
        scope.fireEvent('meeting24HourUpdated', postedData);
    },
    onDeleteMeetingItem: function(id, scope){
        var me = scope;
        scope.deleteMeeting(id, scope);
        scope.fireEvent('meetingItemDeleted', id);
        me.removeEmptyRows();
    },
    onSaveAlternateOptions: function(obj, scope){},
    onSavePrePostDays: function(obj, scope){
        scope.fireEvent('prePostDaysSaved', obj);
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
        var instance = this.getInstance(meeting.date, this);
        if (instance == null)
            throw("Instance not found");
        meeting.room_night = instance.room_night;
        meeting.room_block = instance.room_block;
        if (meeting.room_night == undefined || meeting.room_night == null)
            throw ("room night must be provided");
        if (meeting.room_block == undefined || meeting.room_block == null)
            throw ("room block must be provided");
        this.ajaxController.saveMeetingItem(meeting, this.onSaveMeetingItem, this);
    },
    getInstance: function(d, scope)
    {
        var me = scope;
        var instance = null;
        Ext.each(me.dates, function(i){
            if (i.date && d && i.date.getDate() == d.getDate() && i.date.getMonth() == d.getMonth())
            {
                instance = i;                    
            }
        });
        return instance;
    },
    queueAdditionalDatesToSave: function(copyToDates, meeting, scope)
    {
        var me = scope;
        var dates = copyToDates;
        var listener = null;
        var fn = function(){
            var d = dates.pop();
            if (!d)
            {
                //need to kill the listener so it isn't called on all future saves
                listener.destroy();
                return;
            }
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
                id      : 0,
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
            instance.meetings.push(newMtg);
            me.assignRowIndexes(instance);
            var color = "#" + meeting.meeting_item_type.color;
            var idx = me.calculateRowIndex(newMtg, instance);
            me.createMeeting(newMtg.id, d, start, end, meeting.title, 'white', 
                    color, idx, me, meeting.meeting_item_type);
            
            scope.saveMeetingItem(newMtg);           
        };
        listener = this.on('meetingSaveComplete', fn , scope)
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
        thisa.ajaxController.savePrePostDays(type, count, this.onSavePrePostDays, this);
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
        
    }
    
});

