Ext.ns('AgendaBuilder');

Ext.define('MeetingEditor', {
	extend: 'Ext.window.Window',
    height: 600,
    width: 700,
    modal: true,
    meeting: {},
    style   : 'background-color: white; padding: 10px;',
    bodyStyle: 'border: none;',
    layout  : 'border',
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
                            value       : 0
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
                                             console.log(this.observer.getHourFor24Hrs(newValue));
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
                                    value   : observer.convertTimeTo12Hrs(meeting.end_time),
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
                        text    : '<div class="btn">Cancel</div>'
                    },
                    {
                        xtype   : 'box',
                        width   : 10
                    },
                    {
                        xtype   : 'button',
                        text    : '<div class="btn">Delete</div>'
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
                            console.dir(me.meeting);
                            me.observer.saveMeetingItem(me.meeting);
                        }
                    }
                ]

            }
        ];
    },    
    getVal: function(itemId){
        return Ext.ComponentQuery.query('#' + itemId)[0].getValue();
    },
    setRoomSetup: function(id){
        var me = this;
        // Ext.each(me.roomLayouts, function(rl){
        //     if (rl.getValue() == id)
        //     {
        //        if (rl.clickHandler)
        //             rl.clickHandler(rl, null);
        //         if (rl.renderExtender)
        //             rl.renderExtender(rl);
                
        //     }
        // });
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
            }).delay(1000);
            
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
    },
    getCopyToDates: function(){
        
    }

})

/*

Ext.each(document.querySelectorAll('[id^="ext-element"]'), function(el){
  console.log(el)
  
});

Ext.each(Ext.query('[id^="ext-element"]'), function(el){
   console.dir(Ext.fly(el.dom))
  
});
 */