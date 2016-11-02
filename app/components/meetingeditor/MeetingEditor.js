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
                    style   : 'background-color: white;',
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
                        },
                        {
                            xtype       : 'numberfield',
                            fieldLabel  : '# People in Meeting 2',
                            minValue    : 0,
                            itemId      : 'peopleInMeeting2',
                            value       : 0
                        }
                    ]
                },
                {
                    xtype   : 'container',
                    style   : 'background-color: white; border-left: 1px solid rgba(0, 0, 0, .25);',                    
                    flex    : 1,
                    layout  : {
                        type    : 'vbox',
                        align   : 'stretch'
                    },
                    items   : [
                        {
                            xtype: 'container',
                            height: 50,
                            html: '<div style="text-align:center;font-size:x-large;">' + Ext.Date.format(meeting.date, 'l n/j') + '</div>'
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
                                    listeners: {
                                        change: function(cmp, newValue, oldValue, e)
                                        {
                                            var regex = /^([0]\d|[1][0-2]):([0-5]\d)\s?(?:AM|PM)$/i;
                                            if (!regex.test(newValue))
                                                cmp.el.down('.timeInput').el.dom.classList.add('timeInvalid')
                                            else
                                                cmp.el.down('.timeInput').el.dom.classList.remove('timeInvalid')
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
                                    value   : observer.convertTimeTo12Hrs(meeting.end_time)
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
    buildCenterComponents: function(meeting){
        return [
            {
                xtype   : 'container',
                style   : 'border-top: 1px solid rgba(0, 0, 0, .25); border-bottom: 1px solid rgba(0, 0, 0, .25);  padding: 5px;',
                height  : 175,
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
                items   : [
                    {
                        items   : this.buildRoomLayout('squarelayout')
                    },
                    {
                        style   : 'border-left: 1px solid rgba(0, 0, 0, .25);',
                        items   : this.buildRoomLayout('ushapelayout')
                    },
                    {
                        style   : 'border-left: 1px solid rgba(0, 0, 0, .25);',
                        items   : this.buildRoomLayout('roundlayout')
                    },
                    {
                        style   : 'border-left: 1px solid rgba(0, 0, 0, .25);',
                        items   : this.buildRoomLayout('cocktaillayout')
                    },
                    {
                        style   : 'border-left: 1px solid rgba(0, 0, 0, .25);',
                        items   : this.buildRoomLayout('theaterlayout')
                    },
                    {
                        style   : 'border-left: 1px solid rgba(0, 0, 0, .25);',
                        items   : this.buildRoomLayout('classroomlayout')
                    },
                    {
                        style   : 'border-left: 1px solid rgba(0, 0, 0, .25);',
                        items   : this.buildRoomLayout('boardroomlayout')
                    }
                ]
            },
            {
                xtype   : 'container',
                flex    : 1
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
                        text    : '<div class="btn">Save</div>'
                    }
                ]

            }
        ];
    },
    listeners: {
        beforeshow: function(cmp){
            cmp.title = cmp.meeting.title;
            cmp.add(cmp.buildNorthContainer(cmp.meeting, cmp.observer));
            Ext.ComponentQuery.query('#centerctr')[0].add(cmp.buildCenterComponents(cmp.meeting));
            
        },
        beforehide: function(cmp){
            Ext.each(cmp.roomLayouts, function(c){
                c.clickHandler = null;
                c.destroy();
            });
        }
    }

})