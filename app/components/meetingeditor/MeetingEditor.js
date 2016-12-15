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
                    style   : 'background-color: white; padding-right: 10px;',
                    itemId  : 'fldctr',
                    flex    : 1,
                    layout  : 'form',
                    items   : [
                        {
                            xtype       : 'textfield',
                            fieldLabel  : 'Meeting Title',
                            itemId      : 'meetingTitle',
                            value       : meeting.title

                        },
                        {
                            xtype       : 'numberfield',
                            fieldLabel  : '# People in Meeting 1',
                            minValue    : 0,
                            itemId      : 'peopleInMeeting1',
                            value       : meeting.num_people,
                            cls         : 'numpeoplefield',
                            meetingId   : meeting.id
                        }
                    ]
                },
                {
                    xtype   : 'container',
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
                            html: '<div style="text-align:center;font-size:x-large; font-weight: bold;">' + Ext.Date.format(meeting.date, 'l n/j') + '</div>'
                        },
                        {
                            xtype: 'container',
                            height: 50,
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
        var items = [];
        
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
        
        return [
            {
                xtype   : 'container',
                style   : items.length == 0 ? '' : 'border-top: 1px solid rgba(0, 0, 0, .25); border-bottom: 1px solid rgba(0, 0, 0, .25);  padding: 5px;',
                height  : items.length == 0 ? 0 : 185,
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
                                html : '<div style="font-size: large">Additional Comments</div>'
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
                                html : '<div style="font-size: large">Copy to Event</div>'
                            },
                            {
                                xtype: 'container',
                                itemId: 'copytogrid',
                                style: 'padding: 5px 0px;',
                                cls: 'thinBorderAll',                                                
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
                                            var dateStr = Ext.Date.format(d.date, 'D n/j');
                                            var html = Ext.String.format('<div><span style="font-size:larger;">{0}</span><span style="float:right; font-size:larger;">{1}</span></div>', dateStr, d.roomBlocks);
                                            var selectorXtype = Ext.Date.format(meeting.date, 'Y-m-d') == Ext.Date.format(d.date, 'Y-m-d') ? 'box' : 'checkbox';      
                                            var cls = Ext.Date.format(meeting.date, 'Y-m-d') == Ext.Date.format(d.date, 'Y-m-d') ? '' : 'copyToCheck';   
                                            var parent = me.parent;                                         
                                            items.push(Ext.create('Ext.Container', {
                                                height: 25,
                                                style: 'margin: 0px 5px;',
                                                layout: {
                                                    type: 'hbox',
                                                    align: 'stretch'
                                                },
                                                labelWidth: 0,                                                    
                                                items: [
                                                    {
                                                        xtype: selectorXtype,
                                                        width : 25,
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
                        handler : function(){
                            var me = this;
                            me.meeting.room_setup = '11'//Default to none. We'll set the selected one below
                            var endTime = me.getVal('end_time');
                            me.meeting.end_time = me.observer.convertTimeTo24Hrs(endTime);
                            me.meeting.note = me.getVal('note');
                            me.meeting.num_people = me.getVal('peopleInMeeting1');
                            var startTime = me.getVal('start_time');
                            me.meeting.start_time = me.observer.convertTimeTo24Hrs(startTime);
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
                            if (!me.validate(me.meeting))
                                return;
                            if (!me.meeting.date)
                                me.meeting.date = me.date;
                            if (me.copyToDates.length)
                                me.observer.queueAdditionalDatesToSave(me.copyToDates, me.meeting, me.observer);
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
    validate: function(mtg){
        var isValid = true;
        var msg = "";
        if (!mtg.room_setup)
        {
            msg = "Please select a rooom setup";
            isValid = false;
        }
        if (!mtg.end_time)
        {
            msg = "Please select an end time";
            isValid = false;
        }
        if (!mtg.start_time)
        {
            msg = "Please select a start time";
            isValid = false;
        }
        if (!mtg.num_people)
        {
            msg = "Please select the number of people greater than 0";
            isValid = false;
        }
        if (!mtg.title)
        {
            msg = "Please provide a valid title";
            isValid = false;
        }
        if (mtg.start_time >= mtg.end_time && mtg.end_time != '00:00')
        {
            msg = "Please select a valid time range";
            isValid = false;
        }
        if (!isValid)
            Ext.toast({
                html: msg,
                width: '100%',
                align: 't',
                border: false,
                bodyBorder: false,
                frame: false,
                bodyCls: 'warn-toast',
                cls: 'warn-toast-outer'
            });
        return isValid;
    },
    getVal: function(itemId){
        return Ext.ComponentQuery.query('#' + itemId)[0].getValue();
    },
    setRoomSetup: function(id){
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
                    rl.renderExtender(rl);
                
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
                fldctr.add(Ext.create('Ext.form.field.Number',{
                        fieldLabel  : Ext.String.format('# People in Meeting {0}', i),
                        minValue    : 0,
                        cls         : 'numpeoplefield',
                        itemId      : Ext.String.format('peopleInMeeting{0}', i),
                        value       : mtg.num_people,
                        meetingId   : mtg.id,
                        origValue   : mtg.num_people
                    })
                );

        })
    },
    listeners: {
        beforeshow: function(cmp){
            cmp.title = cmp.meeting.title;
            cmp.add(cmp.buildNorthContainer(cmp.meeting, cmp.observer));
            Ext.ComponentQuery.query('#centerctr')[0].add(cmp.buildCenterComponents(cmp.meeting, cmp.meetingTemplate));
            
        },
        afterrender: function(cmp){
            
            new Ext.util.DelayedTask(function(){
                cmp.setRoomSetup(cmp.meeting.room_setup);
                var overLappingMeetings = cmp.observer.getOverlappingSimilarMeetings(cmp.meeting, cmp.observer);
                cmp.addOverLappingRoomNumPeople(overLappingMeetings, cmp);
            }).delay(100);

            cmp.observer.on({
                scope: cmp,
                meetingSaved: function(){
                    cmp.hide();
                    cmp.destroy();                    
                }
            })
            Ext.query('.x-window-header')[0].style.backgroundColor = '#' + cmp.meeting.meeting_item_type.color;
            Ext.query('.x-title-text')[0].style.color = 'white';
            
            //x-title-text
        },
        beforehide: function(cmp){
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
