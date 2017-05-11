Ext.ns('AgendaBuilder');

Ext.define('MeetingEditor', {
	extend: 'Ext.window.Window',
    height: 600,
    width: 700,
    modal: true,
    meeting: {},
    date: null,
    style   : 'background-color: white; padding: 10px;',
    bodyStyle: 'border: none;',
    layout  : 'border',
    closable: false,
    roomLayouts: [],
    observer: null,        
    copyToDates: [],
    ycoord: null,
    closable: true,
    items: [
        {
            xtype   : 'container',
            region  : 'center',
            itemId  : 'centerctr',
            style   : 'background-color: white;',
            layout  : {
                type    : 'vbox',
                align   : 'stretch'
            }            
        }
    ],
    createNumPeopleCmp: function(meeting, index, bold, scope){
        var me = scope;
        if (meeting.type == 4) //We hide for trade shows
            return new Ext.container.Container({
                hidden: true
            });
        return new Ext.container.Container({
            width       : 317,
            height      : 30,
            style       : 'padding-top: 3px;',
            layout      : {
                type        : 'hbox'
            },
            items       : [
                {
                    xtype       : 'label',
                    style       : 'padding-top:4px !important;',
                    html        : me.getNumPepText(meeting.meeting_item_type.title, index, bold),
                    flex        : 1,
                    height      : 25
                },
                {
                    xtype       : 'numberfield',
                    hideLabel   : true,
                    index       : index,
                    minValue    : 0,
                    maxValue    : maxValsForNine,
                    itemId      :  Ext.String.format('peopleInMeeting{0}', index),
                    value       : meeting.num_people,
                    cls         : 'numpeoplefield',
                    meetingId   : meeting.id,
                    meeting     : meeting,
                    msgTarget   : 'none',
                    height      : 18,
                    validator: function (value) {
                        return true;
                    },
                    listeners   : {
                        change: function(cmp, newValue, oldValue) 
                            {
                                var value = parseInt(newValue);
                                if (isNaN(value))
                                    cmp.setValue(0);
                                if (value < 0)
                                    cmp.setValue(0);
                                if (value > maxValsForNine)
                                    cmp.setValue(maxValsForNine);
                                if (newValue != value)
                                {
                                    if (newValue == null)
                                        cmp.setValue(0);
                                    else if (isNaN(value))
                                        cmp.setValue(0);
                                    else
                                        cmp.setValue(value);
                                }
                            }
                    },
                    width       : 75
                }
            ]
        })
    },
    buildNorthContainer: function(meeting, observer){
        return {
            xtype   : 'container',
            region  : 'north',
            height  :  150,
            layout  : {
                type        : 'hbox',
                align       : 'stretch'
            },
            items   : [
                {
                    xtype   : 'container',
                    style   : 'background-color: white; padding-right: 30px; overflow-y:none; overflow-y: auto !important; ',
                    bodyStyle: 'backgroundColor: red;',
                    itemId  : 'fldctr',
                    width   : 380,
                    flex    : 1,
                    //labelWidth: '200px',
                    items   : [
                        {
                            xtype       : 'textfield',
                            fieldLabel  : 'Meeting Title',
                            itemId      : 'meetingTitle',
                            value       : meeting.title,
                            msgTarget   : 'none',
                            width       : 317

                        },
                        this.createNumPeopleCmp(meeting, 1, true, this)
                    ]
                },
                {
                    xtype   : 'container',
                    height  : 140,
                    style   : 'background-color: white;',
                    cls     : 'thinBorder',                    
                    flex    : 1,
                    layout  : {
                        type    : 'vbox',
                        align   : 'stretch'
                    },
                    items   : [
                        {
                            xtype: 'container',
                            height: 50,
                            html: '<div class="date-large">' + observer.getFullDayOfTheWeek(meeting.date) + " " + meeting.date.getTheMonth() + "/" + meeting.date.getTheDate() + '</div>'
                        },
                        {
                            xtype: 'container',
                            height: 40,
                            layout: {
                                type: 'hbox',
                                align: 'stretch'
                            },
                            items: [
                                {
                                    xtype   : 'container',
                                    flex    : 1
                                },
                                {
                                    xtype   : 'textfield',
                                    width   : 120,
                                    inputCls: 'timeInput',
                                    itemId  : 'start_time',
                                    value   : observer.convertTimeTo12Hrs(meeting.start_time),
                                    observer: observer,
                                    validTime: true,
                                    listeners: {
                                        change: function(cmp, newValue, oldValue, e)
                                        {
                                            var regex = /(01|1|02|2|03|3|04|4|05|5|06|6|07|7|08|8|09|9|10|11|12):?(00|30)\s?(?:AM|PM)/;
                                            if (!regex.test(newValue) || this.observer.getHourFor24Hrs(newValue) < 6 || this.observer.getHourFor24Hrs(newValue) > 24)
                                            {
                                                cmp.el.down('.timeInput').el.dom.classList.add('timeInvalid')
                                                cmp.validTime = false;
                                            }
                                            else
                                            {
                                                cmp.el.down('.timeInput').el.dom.classList.remove('timeInvalid')
                                                cmp.validTime = true;
                                            }
                                        },
                                        blur: function(cmp){
                                            var newValue = cmp.getValue();
                                             var regex = /(01|1|02|2|03|3|04|4|05|5|06|6|07|7|08|8|09|9|10|11|12):?(00|30)\s?(?:AM|PM)/;
                                             
                                            if (!regex.test(newValue) || this.observer.getHourFor24Hrs(newValue) < 6 || this.observer.getHourFor24Hrs(newValue) > 24)
                                            {
                                                cmp.el.down('.timeInput').el.dom.classList.add('timeInvalid')
                                                cmp.validTime = false;
                                            }
                                            else
                                            {
                                                cmp.el.down('.timeInput').el.dom.classList.remove('timeInvalid')
                                                cmp.validTime = true;
                                            }
                                        }
                                    }
                                },
                                {
                                    xtype   : 'container',
                                    width   : 20
                                },
                                {
                                    xtype   : 'textfield',
                                    width   : 120,
                                    inputCls: 'timeInput',
                                    itemId  : 'end_time',
                                    validTime: true,
                                    value   : observer.convertTimeTo12Hrs(meeting.end_time, 6),
                                    observer: observer,
                                    listeners: {
                                        change: function(cmp, newValue, oldValue, e)
                                        {
                                           
                                            var regex = /(01|1|02|2|03|3|04|4|05|5|06|6|07|7|08|8|09|9|10|11|12):?(00|30)\s?(?:AM|PM)/;
                                            
                                            if (!regex.test(newValue) || this.observer.getHourFor24Hrs(newValue) < 6 || this.observer.getHourFor24Hrs(newValue) > 24)
                                            {
                                                cmp.el.down('.timeInput').el.dom.classList.add('timeInvalid')
                                                cmp.validTime = false;
                                            }
                                            else
                                            {
                                                cmp.el.down('.timeInput').el.dom.classList.remove('timeInvalid')
                                                cmp.validTime = true;
                                            }
                                        },
                                        blur: function(cmp){
                                            var newValue = cmp.getValue();
                                            var regex = /(01|1|02|2|03|3|04|4|05|5|06|6|07|7|08|8|09|9|10|11|12):?(00|30)\s?(?:AM|PM)/;
                                            if (!regex.test(newValue) || this.observer.getHourFor24Hrs(newValue) < 6 || this.observer.getHourFor24Hrs(newValue) > 24)
                                            {
                                                cmp.el.down('.timeInput').el.dom.classList.add('timeInvalid')
                                                cmp.validTime = false;
                                            }
                                            else
                                            {
                                                cmp.el.down('.timeInput').el.dom.classList.remove('timeInvalid')
                                                cmp.validTime = true;
                                            }
                                        }
                                    }
                                },
                                {
                                    xtype   : 'container',
                                    flex    : 1
                                }
                            ]
                        }
                    ]
                }
            ]
        };
    },
    buildRoomLayout: function(layout){
        var newCmp = Ext.create(layout);
        var me = this;
        newCmp.clickHandler = function(cmp, e){
            Ext.each(me.roomLayouts, function(c){
                if (!c || !c.el || !c.el.dom)
                    return;
                c.el.dom.classList.remove('roomLayoutSelect');
                c.selected = false;
                Ext.each(Ext.ComponentQuery.query('#extenderRadioGroup'), function(rg){
                    rg.destroy();
                })
                if (c.extender)
                    c.extender.destroy();
            })
            cmp.el.dom.classList.add('roomLayoutSelect');
            cmp.selected = true;
        }
        newCmp.mouseOverHandler = function(cmp, e){
             if (cmp.selected)
                return;
              cmp.el.dom.classList.add('roomLayoutSelect');
        };
        newCmp.mouseOutHandler = function(cmp, e){
            if (cmp.selected)
                return;
            cmp.el.dom.classList.remove('roomLayoutSelect');    
        };
        me.roomLayouts.push(newCmp);
        return newCmp;
    },
    buildCenterComponents: function(meeting, meetingTemplate){
        var me = this;
        var items = [];
        me.roomLayouts = [];
        if (meetingTemplate.is_meal || 
            meetingTemplate.id == 1 || //Meeting
            meetingTemplate.id == 2 || // Breakout
            meetingTemplate.id == 3 ) //General
        {
            items.push({
                            items   : this.buildRoomLayout('squarelayout')
                        });
            items.push({
                            cls     : 'thinBorder',
                            items   : this.buildRoomLayout('ushapelayout')
                        });
            items.push({
                            cls     : 'thinBorder',
                            items   : this.buildRoomLayout('roundlayout')
                        });
            items.push({
                            cls     : 'thinBorder',
                            items   : this.buildRoomLayout('cocktaillayout')
                        });
            items.push({
                            cls     : 'thinBorder',
                            items   : this.buildRoomLayout('theaterlayout')
                        });
            items.push({
                            cls     : 'thinBorder',
                            items   : this.buildRoomLayout('classroomlayout')
                        });
            items.push({
                            cls     : 'thinBorder',
                            items   : this.buildRoomLayout('boardroomlayout')
                        });
        }
        else if (meetingTemplate.id == 4) //exibits
        {
            items.push({
                            items   : this.buildRoomLayout('boothlayout')
                        });
            items.push({
                            cls     : 'thinBorder',
                            items   : this.buildRoomLayout('posterlayout')
                        });
            items.push({
                            cls     : 'thinBorder',
                            items   : this.buildRoomLayout('tabletoplayout')
                        });
        }
        else 
        {
            me.roomLayouts = [];
        }
        
        return [
            {
                xtype   : 'container',
                style   : items.length == 0 ? 'border-top: 1px solid rgba(0, 0, 0, .25);' : 'border-top: 1px solid rgba(0, 0, 0, .25); border-bottom: 1px solid rgba(0, 0, 0, .25);  padding: 5px;',
                height  : items.length == 0 ? 2 : 185,
                layout  : {
                    type    : 'hbox'
                },
                defaults: {
                    flex : 1,
                    layout  : {
                        xtype   : 'vbox'
                    }
                },
                defaultType: 'container',
                items   : items
            },
            {
                xtype   : 'container',
                flex    : 1,
                layout  : {
                    type: 'hbox',
                    align: 'stretch'
                },
                style   : 'padding: 20px;',
                items : [
                    {
                        xtype: 'container',
                        flex : 3,
                        style: 'padding: 0px 10px',
                        layout: {
                            type: 'vbox',
                            align: 'stretch'
                        },
                        items: [
                            {
                                xtype: 'container',
                                html : '<div style="font-size: large">Comments</div>'
                            },
                            {
                                xtype: 'textarea',
                                flex: 1,
                                itemId: 'note',
                                value : meeting.note
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        cls: 'thinBorder'
                    },
                    {
                        xtype: 'container',
                        flex : 2,
                        style: 'padding: 0px 10px',
                        layout: {
                            type: 'vbox',
                            align: 'stretch'
                        },
                        items: [
                            {
                                xtype: 'container',
                                html : '<div style="font-size: large">Copy Event To</div>'
                            },
                            {
                                xtype: 'container',
                                itemId: 'copytogrid',
                                style: 'padding: 5px 0px;',
                                cls: 'thinBorderAll copyTo',                                                
                                flex: 1,
                                layout: {
                                    type: 'vbox',
                                    align: 'stretch'
                                },
                                fullscreen: true,
                                observer: this.observer,
                                parent: this,
                                listeners: {
                                    scope: this,
                                    afterrender: function(me){
                                        var items = [];
                                        Ext.each(me.observer.getDates(), function(d)
                                        {
                                            var dateStr = me.observer.getDayOfTheWeek(d.date) + " " + d.date.getTheMonth() + "/" + d.date.getTheDate();
                                            var html = Ext.String.format('<div><span style="font-size:larger;">{0}</span><span style="float:right; font-size:larger;">{1}</span></div>', dateStr, d.room_block);
                                            var selectorXtype = Ext.Date.format(meeting.date, 'Y-m-d') == Ext.Date.format(d.date, 'Y-m-d') ? 'box' : 'checkbox';      
                                            var cls = Ext.Date.format(meeting.date, 'Y-m-d') == Ext.Date.format(d.date, 'Y-m-d') ? '' : 'copyToCheck';   
                                            var parent = me.parent;                                         
                                            items.push(Ext.create('Ext.Container', {
                                                height: 25,
                                                cls: 'copyDate',
                                                layout: {
                                                    type: 'hbox',
                                                    align: 'stretch'
                                                },
                                                labelWidth: 0,                                                    
                                                items: [
                                                    {
                                                        xtype: selectorXtype,
                                                        width : 30,
                                                        date: d.date,
                                                        cls: cls,
                                                        listeners: {
                                                            scope: me,
                                                            change: function(chkBox, v){
                                                                if (v)
                                                                {
                                                                    parent.copyToDates.push(chkBox.date);
                                                                }
                                                                else
                                                                {
                                                                    var copyToDates = [];
                                                                    Ext.each(parent.copyToDates, function(d){
                                                                        if (d != chkBox.date)
                                                                            copyToDates.push(d)
                                                                    });
                                                                    parent.copyToDates = copyToDates;
                                                                }                                                                                                                               
                                                            }
                                                        }
                                                    },
                                                    {
                                                        xtype: 'displayfield',
                                                        value: html,
                                                        flex: 1
                                                    },
                                                    {
                                                        xtype: 'container',
                                                        width: 25
                                                    }
                                                    ]                                
                                                })
                                            );

                                        }, me);
                                        me.add(items);
                                    }
                                }
                            },
                            {
                                xtype: 'box',
                                height: 3
                            }                            
                        ]
                    }
                ]
            },
            {
                xtype   : 'container',
                height  : 50,
                style   : 'padding: 5px;',
                layout  : {
                    type    : 'hbox',
                    align   : 'stretch'
                },
                items   : [
                    {
                        xtype   : 'button',
                        text    : '<div class="btn">Cancel</div>',
                        scope   : this,
                        handler : function(){
                            var me = this;
                            var id = me.meeting.id != null ? me.meeting.id : 0;
                            if (id == 0) //for unsaved meetings, we remove them
                                me.observer.removeMeeting(id);
                            me.hide();
                            me.destroy();
                        }
                    },
                    {
                        xtype   : 'box',
                        width   : 10
                    },
                    {
                        xtype   : 'button',
                        itemId  : 'deleteBtn',
                        text    : '<div class="btn">Delete</div>',
                        scope   : this,
                        handler : function(){
                            var me = this;
                            var id = me.meeting.id != null ? me.meeting.id : 0;
                            me.observer.deleteMeetingItem(id);
                            me.hide();
                            me.destroy();
                        }
                    },
                    {
                        xtype   : 'box',
                        flex    : 1
                    },
                    {
                        xtype   : 'button',
                        text    : '<div class="btn">Save</div>',
                        scope   : this,
                        handler : function(btn){
                            var me = this;
                            btn.disable();
                            me.meeting.room_setup = '11'//Default to none. We'll set the selected one below
                            var endTime = me.getVal('end_time');
                            me.meeting.end_time = me.observer.convertTimeTo24Hrs(endTime);
                            if (!me.meeting.end_time)
                            {
                                me.observer.showError("Please enter a valid end time");
                                btn.enable();
                                return;
                            }
                            me.meeting.note = me.getVal('note');
                            me.meeting.num_people = me.getVal('peopleInMeeting1');
                            var startTime = me.getVal('start_time');
                            me.meeting.start_time = me.observer.convertTimeTo24Hrs(startTime);
                            if (!me.meeting.start_time)
                            {
                                me.observer.showError("Please enter a valid start time");
                                btn.enable();
                                return;
                            }
                            me.meeting.title = me.getVal('meetingTitle');
                            Ext.each(me.roomLayouts, function(rl){
                                
                                if (rl.selected)
                                {
                                    me.meeting.room_setup = rl.getValue();                                    
                                    if (rl.getAdditionalInfo)
                                    {
                                        var additionalInfo = rl.getAdditionalInfo();
                                        Ext.apply(me.meeting, additionalInfo);
                                    }
                                }
                            });
                            me.room_setup_type = me.observer.getRoomSetup(me.meeting.room_setup)
                            if (!me.validate(me.meeting, me))
                            {
                                btn.enable();
                                return;
                            }
                            if (!me.meeting.date)
                                me.meeting.date = me.date;
                            if (me.copyToDates.length)
                                me.observer.queueAdditionalDatesToSave(me.copyToDates, me.meeting, me.observer);
                            
                            var id = me.meeting.id;
                            if (id ==  null)
                                id = 0;
                            var m_cmp = me.observer.findMeetingComponent(id);
                            if (m_cmp)
                            {
                                var rx = m_cmp.getCurrentRow();
                                var start = me.meeting.start_time;
                                if (start.length == 5)
                                    start = start + ":00";
                                var end = me.meeting.end_time;
                                if (end.length == 5)
                                    end = end + ":00";
                                var dimensions = me.observer.getDimensions(rx, me.meeting.date, start, end);
                                if (dimensions && dimensions.xy)
                                    new Ext.util.DelayedTask(function(){
                                        m_cmp.setX(dimensions.xy[0]);
                                        m_cmp.setWidth(dimensions.width);
                                    }, me).delay(500); 
                            }
                            //getCurrentRow
                            me.observer.saveMeetingItem(me.meeting);
                            Ext.each(Ext.query('.numpeoplefield'), function(el){
                                var nMtgCmp = Ext.getCmp(Ext.fly(el).id);
                                if (nMtgCmp.meetingId != me.meetingId && nMtgCmp.origValue != nMtgCmp.getValue())
                                    me.observer.updateMeetingItemPeople(nMtgCmp.meetingId, nMtgCmp.getValue(), me.observer);
                            })
                            
                        }
                    }
                ]

            }
        ];
    },    
    validate: function(mtg, me){
        var isValid = true;
        var exhibit = 4;
        var msg = "";

        if (!mtg.room_setup)
        {
            msg = "Please select a rooom setup";
            isValid = false;
        }
        if (!mtg.end_time || me.observer.isAfterHour(mtg.end_time, 24))
        {
            msg = "Please enter a valid end time";
            isValid = false;
        }
        if (!mtg.start_time || me.observer.isBeforeHour(mtg.start_time, 6))
        {
            msg = "Please enter a valid start time";
            isValid = false;
        }
        
        if (mtg.type != exhibit && (!mtg.num_people || mtg.num_people < 0 || mtg.num_people > maxValsForNine))
        {
            msg = "Please be sure that all of your person counts are greater than zero";
            isValid = false;
            Ext.each(Ext.query('.numpeoplefield'), function(el){ 
                var cmp = Ext.getCmp(el.id);
                var value = cmp.getValue();
                if (!value || value < 1)
                    cmp.markInvalid(' ');
            })
        }
        else
        {
            Ext.each(Ext.query('.numpeoplefield'), function(el){ 
                Ext.getCmp(el.id).clearInvalid(' ');
            })

        }

        if (mtg.type == exhibit)
        {
            var booth = 9;
            var poster = 10;
            var tableTop = 14;
            if (mtg.room_setup == booth && (mtg.booths > maxValsForNine || mtg.square_feet > maxValsForNine))
            {
                msg = "Please select a validate value.";
                isValid = false;
            }
            else if (mtg.room_setup == poster && (mtg.posters > maxValsForNine || mtg.square_feet > maxValsForNine))
            {
                msg = "Please select a validate value.";
                isValid = false;
            }
            else if (mtg.room_setup == tableTop && (mtg.tabletops > maxValsForNine || mtg.square_feet > maxValsForNine))
            {
                msg = "Please select a validate value.";
                isValid = false;
            }

            if (mtg.room_setup == booth && (!mtg.booths || mtg.booths < 0) && 
                (!mtg.square_feet || mtg.square_feet < 0))
            {
                msg = "Please fill out at least one option for room type.";
                isValid = false;
            }
            else if (mtg.room_setup == poster && (!mtg.posters || mtg.posters < 0) 
                && (!mtg.square_feet || mtg.square_feet < 0))
            {
                msg = "Please fill out at least one option for room type.";
                isValid = false;
            }
            else if (mtg.room_setup == tableTop && (!mtg.tabletops || mtg.tabletops < 0) 
                && (!mtg.square_feet || mtg.square_feet < 0))
            {
                msg = "Please fill out at least one option for room type.";
                isValid = false;
            }

            
        }

        if (!mtg.title || mtg.title.length > 120)
        {
            msg = "Please provide a valid title";
            isValid = false;
            Ext.ComponentQuery.query('#meetingTitle')[0].markInvalid(' ');
        }
        else
        {
            Ext.ComponentQuery.query('#meetingTitle')[0].clearInvalid();
        }
        
        if (mtg.start_time >= mtg.end_time && mtg.end_time != '00:00')
        {
            msg = "Please enter a valid time range";
            isValid = false;
        }

        if (isValid && (!Ext.ComponentQuery.query('#start_time')[0].validTime || !Ext.ComponentQuery.query('#end_time')[0].validTime))
        {
            msg = "Please be sure that start/end times are in H:MM A/PM format and rounded to the nearest half hour interval.";
            isValid = false;
        }

        if (!isValid)
            me.observer.showError(msg);
        return isValid;
    },
    getVal: function(itemId){
        var cmps = Ext.ComponentQuery.query('#' + itemId);
        if (!cmps || !cmps.length)
            return null;
        return cmps[0].getValue();
    },
    setRoomSetup: function(id, mtg){
        var me = this;
        Ext.each(me.roomLayouts, function(rl){
            var match = false;
            Ext.each(rl.values(), function(v){
                if (v == id)
                    match = true;
            })
            if (match)
            {
                
               if (rl.clickHandler)
                    rl.clickHandler(rl, null);
                if (rl.renderExtender)
                    rl.renderExtender(rl, function(){
                        if (!rl.setAdditionalInfo)
                            return;
                        new Ext.util.DelayedTask(function(){
                            rl.setAdditionalInfo(mtg.square_feet, mtg.tabletops, mtg.posters, mtg.booths);
                        }).delay(100);
                    });
            }
        });
    },
    addOverLappingRoomNumPeople: function(overLappingMeetings, scope){
        if (!overLappingMeetings || !overLappingMeetings.length)
            return;
        var fldctr = Ext.ComponentQuery.query('#fldctr')[0];
        var i = 1;
        Ext.each(overLappingMeetings, function(mtg){
                i++;
                fldctr.add(scope.createNumPeopleCmp(mtg, i, false, scope));
        })
    },
    getNumPepText: function(title, index, bold){
        var width = "140px";
        var boldstyle = "";
        if (bold == true)
            boldstyle = "font-weight: bold !important;"
        else
            boldstyle = "font-weight: normal !important;"
        if (title.length >= 10)
            width = "140px";
        if (title.length >= 15)
            width = "210px"; 
        return Ext.String.format('<span style="width:{0};{1}"># People in {2} {3}:</span>', width, boldstyle, title, index);
                
    },
    listeners: {
        beforeshow: function(cmp){
            var me = this;
            cmp.title = cmp.meeting.title;
            cmp.add(cmp.buildNorthContainer(cmp.meeting, cmp.observer));
            if (cmp.ycoord)
            {
                if ((cmp.ycoord + cmp.height) > (window.scrollY + window.innerHeight))
                   cmp.ycoord -= (cmp.ycoord + cmp.height) - (window.scrollY + window.innerHeight);
                cmp.y = cmp.ycoord;
            }
            Ext.ComponentQuery.query('#centerctr')[0].add(cmp.buildCenterComponents(cmp.meeting, cmp.meetingTemplate));
            me.observer.editorVisible = true;
        },
        beforeclose: function(){
            var me = this;
            var id = me.meeting.id != null ? me.meeting.id : 0;
            if (id == 0) //for unsaved meetings, we remove them
                me.observer.removeMeeting(id);            
        },
        afterrender: function(cmp){
            var id = cmp.meeting.id != null ? cmp.meeting.id : 0;
            if (id == 0)
            {
                var cmps = Ext.ComponentQuery.query('#deleteBtn');
                if (cmps && cmps.length)
                    cmps[0].hide();
            }
            cmp.copyToDates = [];
            new Ext.util.DelayedTask(function(){
                cmp.setRoomSetup(cmp.meeting.room_setup, cmp.meeting);
                var overLappingMeetings = cmp.observer.getOverlappingSimilarMeetings(cmp.meeting, cmp.observer);
                cmp.addOverLappingRoomNumPeople(overLappingMeetings, cmp);
                if (cmp.meeting.num_people == 0)
                {
                    var npepCmps = Ext.ComponentQuery.query('#peopleInMeeting1');
                    if (npepCmps && npepCmps.length)
                    {
                        var npepsCmp = npepCmps[0];
                        npepsCmp.setValue(cmp.observer.getUnAccountAttendees(cmp.date, cmp.observer, cmp.meeting));
                    }
                }
                if (cmp.ycoord)
                    cmp.setY(cmp.ycoord);
            }).delay(100);

            cmp.observer.on({
                scope: cmp,
                meetingSaved: function(){
                    cmp.hide();
                    cmp.destroy();                    
                }
            })
            cmp.el.dom.querySelector('.x-window-header').style.backgroundColor = '#' + cmp.meeting.meeting_item_type.color;
            cmp.el.dom.querySelector('.x-title-text').style.color = 'white';
            
        },
        beforehide: function(cmp){
            cmp.observer.editorVisible = false;
            Ext.each(cmp.roomLayouts, function(c){
                c.clickHandler = null;
                if (c.extender)
                {
                    if (c.extender.extenderRadios)
                        Ext.each(c.extender.extenderRadios, function(r){
                            if (r.destroy)
                                r.destroy();
                        });
                    if (c.extender.extenderInput)
                        Ext.each(c.extender.extenderInput, function(r){
                            if (r.destroy)
                                r.destroy();
                        });
                    c.extender.destroy();
                }
                c.destroy();
            });
        }
    }

})
