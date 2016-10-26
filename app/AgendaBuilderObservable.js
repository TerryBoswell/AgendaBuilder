Ext.ns('AgendaBuilder');

Ext.define('AgendaBuilderObservable', {
    extend: 'Ext.mixin.Observable',
    agendaBuilderRows: [], //This holds the agenda builder rows added for each date
    // The constructor of Ext.util.Observable instances processes the config object by
    // calling Ext.apply(this, config); instead of this.initConfig(config);
    $applyConfigs: true,
    rfpNumber: null,
    ajaxUrlBase: 'https://etouches987.zentilaqa.com',
    meeting_item_types: null,
    room_setups: null,
    dates: null,
    totalRowCount: 0,
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
    buildMeetingsForDate: function(instance, context){
        var me = context;
        Ext.each(instance.meetings, function(meeting){
                var start = meeting.start_time.replace('1900/01/01 ', '');
                var end = meeting.end_time.replace('1900/01/01 ', '');
                var color = "#" + meeting.meeting_item_type.color;
                
                me.createMeeting(instance.date, start, end, meeting.title, 'white', 
                    color, me.calculateRowIndex(meeting, instance), me, meeting.meeting_item_type);
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
            return data[idx].start < data[idx - 1].end;
        }

        //we'll order by column index now
        var rowOrderedData = dataOrderedData.sort(function(itemA, itemB){
            if (itemA.rowIndex == itemB.rowIndex)
                return itemA.start.getTime() - itemB.start.getTime();
            return itemA.rowIndex - itemB.rowIndex;
        })

        //console.dir(rowOrderedData);
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
    calculateRowIndex(meeting, instance){
        return meeting.rowIndex - 1;
        //if (meeting.meeting_item_type.is_meal)
        //    return 0;
        //return 1;
    },
    addPreDays: function(count){
        var me = this;
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
                roomNight: 0
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
                roomNight: 0
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
            };
            var data = instance.date.toLocaleDateString();
            //This methods assigns the row index to the meetings and returns the number
            //of rows we need
            var rowCount = me.assignRowIndexes(instance);
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
                        {html: '-Hide', cls: '', style : 'color: #43b8bc;text-align: center;height: 42px;', Index: 1}
                        ]
                });
            parentCtr.add(bottomRow);
            

            agendaBuilderRow.rows.push({id: topRow.id});
            agendaBuilderRow.rows.push({id: bottomRow.id});
            this.agendaBuilderRows.push(agendaBuilderRow);
            for(j = 2; j < rowCount; j++)
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
    addAdditionalRow: function(date, context, agendaBuilderRow, buildMeetings){
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
                        {html: '-Hide', cls: '', style : 'color: #43b8bc;text-align: center;height: 42px;', Index: 1}
                        ]
                });
        //datesCtr.insert(agendaBuilderRow.rows.length, row);
        datesCtr.add(row);
        agendaBuilderRow.rows.push({id: row.id})
        //me.removeAllMeetings();
        //Ext.each(me.dates, function(instance){
        //    me.buildMeetingsForDate(instance, me);
        //})
        
    },
    buildHourColumns: function(cnt){
        var cols = [];
        for(i = 0; i < cnt; i++)
        {
            cols.push({html: '', style: ''});
        }
        return cols;
    },
    createMeeting: function(date, startHour, endHour, text, color, fontColor, rowIdx, context, MeetingTemplate){
        if (context)
            var me = context;
        else
            var me = this;
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
        var efly = Ext.fly(document.getElementById(endHourId))
        var width = xy[0] - efly.getXY()[0];
        var datesCtr = Ext.ComponentQuery.query('#datesCtr')[0];
        var datesCtrXY = datesCtr.getXY();
        var cmp = Ext.create('Ext.Component', {
            html: text,
            floating: true,
            height : height - 6,
            width: width,
            cls: 'mtg-instance',
            style: {
                paddingTop: '3px',
                paddingLeft: '3px',
                color: color,
                backgroundColor: fontColor,
                borderRadius: '3px'
            },
            x: xy[0] - datesCtrXY[0],
            y: xy[1] - datesCtrXY[1] + 3,
            renderTo: datesCtr.el//Ext.getBody()
        });

        new Ext.tip.ToolTip({
            target: cmp.el,
            html: 'Meeting ' + text,
            modal: true,
            mouseOffset: [60,0]
        });
        return {
            booths: 0,
            start_time: startHour,
            tabletops: 0,
            square_feet: 0,
            posters: 0,
            id: null,
            title: text,
            all_day: false,
            note: "",
            room_setup: null,
            end_time: endHour,
            num_people: 0,
            type: MeetingTemplate.id,
            date: date
        };
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
    showMeetingEditor: function(mtgCmp, meeting){
        var datesCtr = Ext.ComponentQuery.query('#MainContainer')[0];
        Ext.create('MeetingEditor', {
            meeting: meeting,
            alignTarget: datesCtr
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
    onSaveMeetingItem: function(obj){},
    onDeleteMeetingItem: function(obj){},
    onSaveAlternateOptions: function(obj){},
    /*******************Ajax calls */ 
    getUrl: function(callUrl){
        if (!this.ajaxUrlBase)
            throw("ajax Url Base must be set");
        if (!this.rfpNumber)
            throw("rpf number must be set");
        if (!callUrl)
            throw("call url must be passed")
        return this.ajaxUrlBase.concat(callUrl, this.rfpNumber, "/json/");
    },   
    doGet: function(url, callback){      
        var me = this;   
        Ext.Ajax.request({
            url: this.getUrl(url),
            method: 'GET',
            scope: me,
            success: function(response, opts) {
                var obj = Ext.decode(response.responseText);
                callback(obj, opts.scope);
            },

            failure: function(response, opts) {
                console.log('server-side failure with status code ' + response.status);
            }
        });
    },
    doPost: function(url, callback, data){

    },
    getRoomSetups: function(){
        this.doGet("/planners/rfp/meeting_room_setups/", this.onGetRoomSetups);
    },
    getMeetingItemTypes: function(){
        this.doGet("/planners/rfp/meeting_item_types/", this.onGetMeetingItemTypes);
    },
    getMeetingItems: function(){
        this.doGet("/planners/rfp/meeting_items/", this.onGetMeetingItems);
    },
    saveMeetingItem: function(){},
    deleteMeetingItem: function(){},
    saveAlternateOption: function(){}
    
});

