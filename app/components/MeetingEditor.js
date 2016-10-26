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
    items: [
        {
            xtype   : 'container',
            region  : 'center',
            itemId  : 'centerctr',
            style   : 'background-color: white;'            
        }
    ],
    buildNorthContainer: function(meeting){
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
                            fieldLabel  : 'Meeting Title'
                        },
                        {
                            xtype       : 'numberfield',
                            fieldLabel  : '# of People',
                            minValue    : 0
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
                        }
                    ]
                }
            ]
        };
    },
    listeners: {
        beforeshow: function(cmp){
            cmp.title = cmp.meeting.title;
            cmp.add(cmp.buildNorthContainer(cmp.meeting));
            Ext.ComponentQuery.query('#centerctr')[0].html = Ext.encode(cmp.meeting);
        }
    }

})