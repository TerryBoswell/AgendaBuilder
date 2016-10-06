Ext.ns('AgendaBuilder');

Ext.define('AgendaBuilderObservable', {
    extend: 'Ext.mixin.Observable',
    agendaBuilderRows: [], //This holds the agenda builder rows added for each date
    // The constructor of Ext.util.Observable instances processes the config object by
    // calling Ext.apply(this, config); instead of this.initConfig(config);
    $applyConfigs: true,
    buildMeetings : function(){
    	for(i = 0; i < 6; i++)
    	{
	    	Ext.ComponentQuery.query("#northCtrMtg")[0].add(Ext.create('MeetingTemplate', 
                    {
                        html: '<div style=""><i style="padding-left:3px; padding-top:3px;" class="fa fa-bars fa-2x" aria-hidden="true"></i><span style="margin-left: 3px; margin-left:10px;">Meeting</span></div>',
                        style:  'margin: 3px; border-radius: 5px; background-color: orange; color: white;',
                    }));

            Ext.ComponentQuery.query("#northCtrMeal")[0].add(Ext.create('MeetingTemplate', 
                    {
                        html: '<div style=""><i style="padding-left:3px; padding-top:3px;" class="fa fa-bars fa-2x" aria-hidden="true"></i><span style="margin-left: 3px; margin-left:10px;">Meal</span></div>',
                        style:  'margin: 3px; border-radius: 5px; background-color: olivedrab; color: white;',
                    }));
	    	
	    }
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
    buildDates: function(cfg){
        var datesCtr = Ext.ComponentQuery.query('#datesCtr')[0];
        var me = this;
        Ext.each(cfg.Dates, function(instance){
            me.buildSingleDate(instance, datesCtr);
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
        if (hour == '6:00')
            return 3;
        else if (hour == '6:30')
            return 4;
        else if (hour == '7:00')
            return 5;
        else if (hour == '7:30')
            return 6;
        else if (hour == '8:00')
            return 7;
        else if (hour == '8:30')
            return 8;
        else if (hour == '9:00')
            return 9;
        else if (hour == '9:30')
            return 10;
        else if (hour == '10:00')
            return 11;
        else if (hour == '10:30')
            return 12;
        else if (hour == '11:00')
            return 13;
        else if (hour == '11:30')
            return 14;
        else if (hour == '12:00')
            return 15;
        else if (hour == '12:30')
            return 16;
        else if (hour == '13:00')
            return 17;
        else if (hour == '13:30')
            return 18;
        else if (hour == '14:00')
            return 19;
        else if (hour == '14:30')
            return 20;
        else if (hour == '15:00')
            return 21;
        else if (hour == '15:30')
            return 22;
        else if (hour == '16:00')
            return 23;
        else if (hour == '16:30')
            return 24;
        else if (hour == '17:00')
            return 25;
        else if (hour == '17:30')
            return 26;
        else if (hour == '18:00')
            return 27;
        else if (hour == '18:30')
            return 28;
        else if (hour == '19:00')
            return 29;
        else if (hour == '19:30')
            return 30;
        else if (hour == '20:00')
            return 31;
        else if (hour == '20:30')
            return 32;
        else if (hour == '21:00')
            return 33;
        else if (hour == '21:30')
            return 34;
        else if (hour == '22:00')
            return 35;
        else if (hour == '22:30')
            return 36;
        else if (hour == '23:00')
            return 37;
        else if (hour == '23:30')
            return 38;
    },
    createMeeting: function(date, hour, text, width, color, fontColor, rowIdx){
        var agendaBuilderRow = this.getRow(date);
        //temp to get the first row
        if (rowIdx == undefined || rowIdx == null)
            rowIdx = 0;
        var row = agendaBuilderRow.rows[rowIdx];
        var colId = this.getColForHour(hour);
        var hourId = row.id + "-col-" + colId;
        var fly = Ext.fly(document.getElementById(hourId));
        var xy = fly.getXY();
        var height = fly.getHeight();
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
    }
});

