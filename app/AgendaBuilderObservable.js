Ext.ns('AgendaBuilder');

Ext.define('AgendaBuilderObservable', {
    extend: 'Ext.mixin.Observable',
    agendaBuilderRows: [], //This holds the agenda builder rows added for each date
    // The constructor of Ext.util.Observable instances processes the config object by
    // calling Ext.apply(this, config); instead of this.initConfig(config);
    $applyConfigs: true,
    rfpNumber: null,
    meeting_item_types: null,
    room_setups: null,
    dates: null,
    totalRowCount: 0,
    meetingCallouts: [],
    ajaxController: null,
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
                            '<i style="padding-left:3px; padding-top:3px;" class="fa fa-bars fa-2x" aria-hidden="true"></i>',
                            '<span style="margin-left: 3px; margin-left:10px;">{title}</span>',
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
        var dateStr =    Ext.Date.format(date, "m/d/Y");
        Ext.each(instance.meetings, function(m){
            m.start = new Date(m.start_time.replace('1900/01/01', dateStr) + ' GMT+0000');
            m.end = new Date(m.end_time.replace('1900/01/01', dateStr) + ' GMT+0000');
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
            //console.log(d.title + " " + d.rowIndex);            
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
            return data[idx].start < data[idx - 1].end;
        }

        //we'll order by column index now
        var rowOrderedData = dataOrderedData.sort(function(itemA, itemB){
            if (itemA.rowIndex == itemB.rowIndex)
                return itemA.start.getTime() - itemB.start.getTime();
            return itemA.rowIndex - itemB.rowIndex;
        })

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
            //if (date.getDate() == 21)
            //    console.log(instance.meetings[i].title + " " + instance.meetings[i].rowIndex);
            
        }
        /*********************************/
        return maxRows;
    },
    calculateRowIndex(meeting, instance){
        return meeting.rowIndex - 1;
        //if (meeting.meeting_item_type.is_meal)
        //    return 0;
        //return 1;
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
                roomBlocks: 0,
                roomNight: firstDate.roomNight - i
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
                roomBlocks: 0,
                roomNight: lastDate.roomNight + i
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
                    columns: [
                        {html: day + ' ' + (instance.date.getMonth() + 1) + '/' + instance.date.getDate(), 
                            style: 'font-size:medium; text-align: center;', Index: 0, cls: ''},
                        {html: '<span style="background-color: teal;text-align:center; padding: 5px 8px; border-radius: 3px;">' + instance.roomBlocks + 
                            '</span>', style: '', Index: 1, cls: ''}
                        ]
                });
            parentCtr.add(topRow);
            var bottomRow = Ext.create('AgendaRow', 
                {
                    height: 50,
                    evenColClass : 'evenRowBackGroundB',
                    dataField: data,
                    observer: this,
                    columns: [
                        {cls: '', Index: 0},
                        {html: '', cls: '', style : 'color: #43b8bc;text-align: center;height: 42px;', Index: 1}//{html: '-Hide', cls: '', style : 'color: #43b8bc;text-align: center;height: 42px;', Index: 1}
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
                    defaultColStyle:'border-bottom: 1px solid grey'
                });
            parentCtr.add(dvdr);
    },
    removeAllMeetings: function(){
        Ext.each(Ext.query('.mtg-instance'), function(el){
            Ext.fly(el).destroy()
        })
    },
    addAdditionalRow: function(date, context, agendaBuilderRow, insertRowAt){
        if (context)
            var me = context;
        else
            var me = this;
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
                    columns: [
                        {cls: '', Index: 0},
                        {html: '', cls: '', style : 'color: #43b8bc;text-align: center;height: 42px;', Index: 1} //{html: '-Hide', cls: '', style : 'color: #43b8bc;text-align: center;height: 42px;', Index: 1}
                        ]
                });
        if (insertRowAt == null || insertRowAt == undefined)
            datesCtr.add(row);
        else
        {
            datesCtr.insert(insertRowAt, row);
        }
        agendaBuilderRow.rows.push({id: row.id})
        
        
    },
    buildHourColumns: function(cnt){
        var cols = [];
        for(i = 0; i < cnt; i++)
        {
            cols.push({html: '', style: ''});
        }
        return cols;
    },
    createMeeting: function(id, date, startHour, endHour, text, fontColor, color, rowIdx, context, MeetingTemplate){
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
        var agendaBuilderRow = me.getRow(date);
        //temp to get the first row
        if (rowIdx == undefined || rowIdx == null)
            rowIdx = 0;
        var row = agendaBuilderRow.rows[rowIdx];
        var startColId = me.getColForHour(startHour);
        var startHourId = row.id + "-col-" + startColId;
        var sfly = Ext.fly(document.getElementById(startHourId));
        var xy = sfly.getXY();
        var height = sfly.getHeight();

        var endColId = me.getColForHour(endHour);
        var endHourId = row.id + "-col-" + endColId;
        var efly = Ext.fly(document.getElementById(endHourId));
        if (!efly)
        {
            return;
        }
        
        var width = Math.abs(xy[0] - efly.getXY()[0]);
        
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
                        var x = centerX - (tEl.getWidth() / 2) - datesCtrXY[0];
                        var y = centerY - datesCtrXY[1];
                        tEl.setPosition(x, y);
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
                                    html: Ext.String.format('<div class="title-text" style="font-size:larger; margin-left:auto;margin-right:auto;text-align:center;">{0}</div>', tEl.titleText),
                                    height: 25,
                                    style: {
                                        color: tEl.titleFontColor,
                                        backgroundColor: tEl.titleColor
                                    },
                                    cls: 'callout-title'
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
                                                        delete(mtg.id);
                                                        Ext.each(targetCmp.observer.meetingCallouts, function(callout){
                                                            callout.hide();
                                                        })
                                                        targetCmp.observer.showMeetingEditor(mtg, targetCmp.observer, mtg.meeting_item_type, mtg.date);
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
                        cmp.tipCenter = cmp.getX() - (cmp.getWidth() / 2);
                        if (cmp.pendingShift)
                        {
                            var tipY = cmp.getY();
                            cmp.setY(cmp.pendingShift + tipY);
                            delete(cmp.pendingShift);
                        }
                    }
                }
            })   
        }
        var mtg = observer.getMeeting(id, observer);
        if (!mtg)
            mtg = m;
        var mtgHtml = '<div class="truncate">' + 
                        '<span>' + text  + "<span><div>" + 
                        '<span>' + mtg.room_setup_type.title + " | " + mtg.num_people +"pp</span>"
                       '</div>';
        var cmp = Ext.create('Ext.Component', {
            html: mtgHtml,
            floating: true,
            height : height - 6,
            width: width,
            cls: 'mtg-instance',
            meetingId: id,
            observer: observer,
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
                widthIncrement: Ext.fly(Ext.query('.evenRowBackGroundA')[0]).getWidth(),
                //transparent: true,
                pinned: true,
                dynamic: true
            },
            listeners: {
                delay: 100,
                afterrender: function(cmp) {
                    cmp.mon(cmp.el, 'click', function(){
                        cmp.extender.show();
                    })
                    Ext.each(Ext.query('.x-resizable-handle'), function(q){
                        var fly = new Ext.fly(q);
                        if (!fly)
                            return;
                        fly.el.dom.classList.add('x-resizable-pinned-mtg');
                    });
                    
                    cmp.mon(cmp.el, 'mouseup', function(){
                        var match = null;
                        var x = cmp.getX() + 1;
                        var y = cmp.getY();
                        Ext.each(document.elementsFromPoint(x, y), function(el){
                        if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
                            match = el;
                        })
                        var start = (match.dataset.hour)

                        x+=cmp.getWidth();
                        Ext.each(document.elementsFromPoint(x, y), function(el){
                        if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
                            match = el;
                        })
                        var end = (match.dataset.hour);
                        var mtg = cmp.observer.getMeeting(cmp.meetingId, cmp.observer);
                        if (mtg.start_time.replace('1900/01/01 ', '') == start &&
                            mtg.end_time.replace('1900/01/01 ', '') == end)
                            return;
                        mtg.start_time = start;
                        mtg.end_time = end;
                        cmp.observer.saveMeetingItem(mtg);
                    })
                },
                resize: function(cmp, width, height, oldwidth, oldheight, opts)
                {
                    if (!width || !oldwidth)
                        return;
                    Ext.each(cmp.observer.meetingCallouts, function(callout){
                        callout.hide();
                    })
                }
            }

        });

        this.meetingCallouts.push(createTip(cmp, datesCtr, id, this, color, fontColor, text));
        
        return m;
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
    updateMeetingText: function(meetingId, title, start, end, room_setup_type, num_people, scope){
        var me = scope;
        var tip = me.findMeetingTip(meetingId);
        if (tip == null)
            return;
        
        tip.el.down('.callout-title').down('.title-text').el.dom.innerHTML = title;
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
        mtg.update(mtgHtml);

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
            meetingTemplate, meetingTemplate,
            date: date
        }).show();

    },
    /*******************Scrolling Functionality************/
    setScrollingHandlers: function(){
        //We are dealing with the left and right scrolling here
        var rightNorthCtrMtg = Ext.ComponentQuery.query('#rightNorthCtrMtg')[0];
        var leftNorthCtrMtg = Ext.ComponentQuery.query('#leftNorthCtrMtg')[0];
        var northCtrMtg = Ext.ComponentQuery.query('#northCtrMtg')[0];
        var northCtrMtgItems = northCtrMtg.items.items;
        var mtgFarLeft = northCtrMtg.getX();
        var mtgFarRight = mtgFarLeft + northCtrMtg.getWidth();
        rightNorthCtrMtg.mon(rightNorthCtrMtg.el, 'click', function(){
            if (northCtrMtgItems[0].getX() >= mtgFarLeft)
                return;
            Ext.each(northCtrMtgItems, function(i){
                i.setX(i.getX() + 20);
            })
        });
        leftNorthCtrMtg.mon(leftNorthCtrMtg.el, 'click', function(){
            var lastItem = northCtrMtgItems[northCtrMtgItems.length - 1];
            if (lastItem.getX() + lastItem.getWidth() <= mtgFarRight)
                return;
            Ext.each(northCtrMtgItems, function(i){
                i.setX(i.getX() - 20);
            })
        });

        var rightNorthCtrMeal = Ext.ComponentQuery.query('#rightNorthCtrMeal')[0];
        var leftNorthCtrMeal = Ext.ComponentQuery.query('#leftNorthCtrMeal')[0];
        var northCtrMeal = Ext.ComponentQuery.query('#northCtrMeal')[0];
        var northCtrMealItems = northCtrMeal.items.items;
        var mealFarLeft = northCtrMeal.getX();
        var mealFarRight = mealFarLeft + northCtrMeal.getWidth();
        rightNorthCtrMeal.mon(rightNorthCtrMeal.el, 'click', function(){
            if (northCtrMealItems[0].getX() >= mealFarLeft)
                return;
            Ext.each(northCtrMealItems, function(i){
                i.setX(i.getX() + 20);
            })
        });
        leftNorthCtrMeal.mon(leftNorthCtrMeal.el, 'click', function(){
            var lastItem = northCtrMealItems[northCtrMealItems.length - 1];
            if (lastItem.getX() + lastItem.getWidth() <= mealFarRight)
                return;
            Ext.each(northCtrMealItems, function(i){
                i.setX(i.getX() - 20);
            })
        });                
    },
    convertTimeTo12Hrs: function(time){
        time = time.replace('1900/01/01 ', '');
        var hr = time.substring(0,2) * 1;
        var slice = "AM"
        if (hr > 12)
        {
            hr = hr - 12;
            slice = "PM";
        }
        var min = time.substring(3,5);
        return Ext.String.format("{0}:{1} {2}", hr, min, slice);
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
                var hours = time.getUTCHours();
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
                roomBlocks: data.room_block,
                roomNight: data.room_night,
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
                     //console.log(lmtg.date + lmtg.title + lmtg.rowIndex);
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
        var row = agendaBuilderRow.rows[rowIdx];
        var startHour = fmtTime(savedMeeting.start_time);
        var endHour = fmtTime(savedMeeting.end_time);
        var startColId = me.getColForHour(startHour);
        var startHourId = row.id + "-col-" + startColId;
        var sfly = Ext.fly(document.getElementById(startHourId));
        var xy = sfly.getXY();
        var endColId = me.getColForHour(endHour);
        var endHourId = row.id + "-col-" + endColId;
        var efly = Ext.fly(document.getElementById(endHourId));
        if (efly)
        {
            var width = Math.abs(xy[0] - efly.getXY()[0]);    
            var mtgCmp = me.findMeetingComponent(savedMeeting.id);
            //meeting lenght changed
            if (width != mtgCmp.getWidth())
                mtgCmp.setWidth(width)
            //meeting start or end changed
            var mtgX = mtgCmp.getXY()[0];
            if (xy[0] != mtgX)
            {
                mtgCmp.setX(xy[0]);
                var tipCmp = me.findMeetingTip(savedMeeting.id);

                var mtgCenter = xy[0] - (width / 2);
                var difference = mtgCenter - tipCmp.tipCenter; 
                tipCmp.setX(tipCmp.getX() - difference);
            }
        }
        
        scope.fireEvent('meetingSaved', newRows);
        var rowInsertedAt = null; //tracks which row has the first insert
        var startShift = false; //tracks that a shift has started. There will only ever be on shift at a time in this method and it is down only
        var lastMtg = null; //keep track of the last meeting for the first shift;

        var getTotalRowsInAboveDates = function(rowIndex, dates, observer)
        { 
             var rowCount = 0;  
             for(i = 0; i < rowIndex; i++)
             {  
                 var maxRow = observer.getMaxRowsForDate(dates[i].meetings);
                 rowCount += maxRow;
             }
             return rowCount;
        }

        Ext.each(scope.dates, function(d){
            var row = me.getRow(d.date);
            Ext.each(d.meetings, function(mtg){
                var rowsAbove = getTotalRowsInAboveDates(row.rowIndex, scope.dates, scope);
                var oldidx = (mtg.oldRowIndex ? mtg.oldRowIndex : 1) + row.rowIndex;
                var newidx = mtg.rowIndex + row.rowIndex;
                
                if (rowInsertedAt == null && oldidx != newidx && mtg.id != postedData.id) //We need the first occurance where the row changed position
                {
                    console.log(rowsAbove);
                    rowInsertedAt = mtg.rowIndex + rowsAbove;//oldidx;
                    if (scope.getMaxRowsForDate(d.meetings) != row.rows.length)
                    {
                        me.addAdditionalRow(d.date, me, row, rowInsertedAt);
                    }    
                    startShift = true;
                    if (lastMtg != null) //We are shifting down the last meeting since it will be the start of the shift
                    {
                        var shiftAmount = lastMtg.rowIndex  - 2; //We need 2 because we always start at row 1 with a base of 0
                        if (shiftAmount > 0)
                            me.moveMeetingDownXRows(lastMtg.id, shiftAmount, me);                    
                    }
                }
                else if (oldidx == 1 && mtg.id == postedData.id && (mtg.rowIndex - 2) > 1) //This is a bigger shift down, not the first row to second
                {
                    console.log(rowsAbove);
                    rowInsertedAt = mtg.rowIndex + rowsAbove - 1;//oldidx;
                    if (scope.getMaxRowsForDate(d.meetings) != row.rows.length)
                    {
                        me.addAdditionalRow(d.date, me, row, rowInsertedAt);
                    }
                    startShift = true;
                    var shiftAmount = mtg.rowIndex  - 3;
                    me.moveMeetingDownXRows(mtg.id, shiftAmount, me);
                }
                if (startShift)
                {
                    me.moveMeetingDownXRows(mtg.id, 1, me);
                }
                lastMtg = mtg;
            })
        });       
        me.updateMeetingText(postedData.id, postedData.title, postedData.start, postedData.end, postedData.room_setup_type, postedData.num_people, me);
        scope.fireEvent('meetingSaveComplete', newRows);
    },
    onUpdateMeetingItemPeople: function(postedData, response, scope){
        var me = scope;
        me.updateMeetingText(postedData.id, postedData.title, postedData.start, postedData.end, postedData.room_setup_type, postedData.num_people, me);
    },
    onDeleteMeetingItem: function(id, scope){
        scope.deleteMeeting(id, scope);
        scope.fireEvent('meetingItemDeleted', id);
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
        this.on('meetingSaveComplete', function(){
            var d = dates.pop();
            if (!d)
                return;
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
                id      : 0
            };
            instance.meetings.push(newMtg);
            me.assignRowIndexes(instance);
            var start = meeting.start_time.replace('1900/01/01 ', '');
            var end = meeting.end_time.replace('1900/01/01 ', '');
            var color = "#" + meeting.meeting_item_type.color;
            var idx = me.calculateRowIndex(newMtg, instance);
            me.createMeeting(newMtg.id, d, start, end, meeting.title, 'white', 
                    color, idx, me, meeting.meeting_item_type);

            scope.saveMeetingItem(newMtg);           
        }, scope)
    },
    updateMeetingItemPeople: function(meetingId, numPeople, scope){
        var me = scope;
        var mtg = me.getMeeting(meetingId, me);
        if (!mtg)
            throw("Meeting not found");
        mtg.num_people = numPeople;
        this.ajaxController.saveMeetingItem(mtg, this.onUpdateMeetingItemPeople, this);
    },
    deleteMeetingItem: function(id){
        this.ajaxController.deleteMeetingItem(id, this.onDeleteMeetingItem, this);
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
            return 38;            
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
                            hooks[name] = hook = {
                                name: Element.normalize(name)
                            };
                        }
                        value = (value == null) ? '' : value;
                        // map null && undefined to ''
                        if (hook.set) {
                            hook.set(dom, value, me);
                        } else {
                            style[hook.name] = value;
                        }
                        if (hook.afterSet) {
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
                    if (shadow && !shadow.hidden && !shadow.destroyed) {
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
            }
        })

        Ext.override(Ext.Component, {
            translateXY: function(x, y) {
                if (!this.el)
                    return;
                this.callSuper(x, y);
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
        
    }
    
});

