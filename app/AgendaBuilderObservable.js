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
    buildMeetings : function(meeting_item_types){
        Ext.each(meeting_item_types, function(m){
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
            var ctrId = "#northCtrMeal";
            if (!m.is_meal)
                ctrId = "#northCtrMtg";
            var width = (m.title.length * 6) + 50;
            Ext.ComponentQuery.query(ctrId)[0].add(Ext.create('MeetingTemplate', 
            {
                html: t.apply(m),
                style:  style,
                width: width
            }));
 
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
        var datesCtr = Ext.ComponentQuery.query('#datesCtr')[0];
        var me = this;
        Ext.each(dates, function(instance){
            me.buildSingleDate(instance, datesCtr);
            Ext.each(instance.meetings, function(meeting){
                var start = meeting.start_time.replace('1900/01/01 ', '');
                var end = meeting.end_time.replace('1900/01/01 ', '');
                var color = "#" + meeting.meeting_item_type.color;
                me.createMeeting(instance.date, start, end, meeting.title, 'white', color, 1)
            })
        });
        
    },
    buildSingleDate: function(instance, parentCtr){
            var me = this;
            var day = me.getDayOfTheWeek(instance.date);
            var agendaBuilderRow = {
                rows : [],
                date: instance.date,
                meetings: []
            };
            var topRow = Ext.create('AgendaRow', 
                {
                    height: 50,
                    evenColClass : 'evenRowBackGroundA',
                    oddColClass: 'oddRowBackGround',
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
                    columns: [
                        {cls: '', Index: 0},
                        {html: '-Hide', cls: '', style : 'color: #43b8bc;text-align: center;height: 42px;', Index: 1}
                        ]
                });
            parentCtr.add(bottomRow);

            agendaBuilderRow.rows.push({id: topRow.id});
            agendaBuilderRow.rows.push({id: bottomRow.id});
            this.agendaBuilderRows.push(agendaBuilderRow);

            var dvdr = Ext.create('AgendaRow', 
                {
                    height: 1,
                    defaultColStyle:'border-bottom: 1px solid grey'
                });
            parentCtr.add(dvdr);
    },
    buildHourColumns: function(cnt){
        var cols = [];
        for(i = 0; i < cnt; i++)
        {
            cols.push({html: '', style: ''});
        }
        return cols;
    },
    getColForHour: function(hour){
        if (hour == '06:00')
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
    createMeeting: function(date, startHour, endHour, text, color, fontColor, rowIdx){
        var agendaBuilderRow = this.getRow(date);
        //temp to get the first row
        if (rowIdx == undefined || rowIdx == null)
            rowIdx = 0;
        var row = agendaBuilderRow.rows[rowIdx];
        var startColId = this.getColForHour(startHour);
        var startHourId = row.id + "-col-" + startColId;
        var sfly = Ext.fly(document.getElementById(startHourId));
        var xy = sfly.getXY();
        var height = sfly.getHeight();

        var endColId = this.getColForHour(endHour);
        var endHourId = row.id + "-col-" + endColId;
        var efly = Ext.fly(document.getElementById(endHourId))
        var width = xy[0] - efly.getXY()[0];

        Ext.create('Ext.Component', {
            html: text,
            floating: true,
            height : height - 6,
            width: width,
            style: {
                paddingTop: '3px',
                paddingLeft: '3px',
                color: color,
                backgroundColor: fontColor,
                borderRadius: '3px'
            },
            x: xy[0],
            y: xy[1] + 3,
            renderTo: Ext.getBody()
        });
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

