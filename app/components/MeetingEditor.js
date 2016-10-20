Ext.ns('AgendaBuilder');

Ext.define('MeetingEditor', {
	extend: 'Ext.window.Window',
    height: 400,
    width: 400,
    modal: true,
    meeting: {},
    items: [
        {
            xtype   : 'container'
        }
    ],
    listeners: {
        beforeshow: function(cmp){
            cmp.title = cmp.meeting.title;
        }
    }

})