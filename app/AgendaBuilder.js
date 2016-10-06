Ext.ns('AgendaBuilder');

var centerContainer = Ext.create('CenterContainer');

var observer = Ext.create('AgendaBuilderObservable');
window.agendaBuilder = {};
Ext.define('AgendaBuilder.MainContainer', {

	extend: 'Ext.Container',
	width: 900,
	style:  'margin:20px;',
    height: 600,
    title:'Month Browser',
    layout: 'border',
    items: [
    	{
    		xtype	: 'container',
    		region	: 'north',
    		layout	: {type: 'vbox', align: 'stretch'},
    		height	: 90,
    		itemId	: 'northCtrOuter',
            items   : [
                {
                    flex: 1,
                    xtype: 'container',
                    layout  : {type: 'hbox', align: 'stretch'},
                    items   : [
                        {
                            width: 35,
                            xtype: 'container',
                            style:  'background-color: #d9d9db;',
                            html: '<div ><i style="margin-top: 2px; float: left;" class="fa fa-chevron-circle-left fa-3x" aria-hidden="true"></i></div>'
                        },
                        {
                            flex: 1,
                            xtype: 'container',
                            itemId: 'northCtrMtg',
                            style:  'background-color: #d9d9db;',
                            layout  : {type: 'hbox', align: 'stretch'} 
                        },
                        {
                            width: 35,
                            xtype: 'container',
                            style:  'background-color: #d9d9db;',
                            html: '<div ><i style="margin-top: 2px; float: right;" class="fa fa-chevron-circle-right fa-3x" aria-hidden="true"></i></div>'
                        
                        }

                    ]
                },
                {
                    xtype   : 'container',
                    height: 10,
                    style: 'background-color: #DFE8F6;'
                },
                {
                    flex: 1,
                    xtype: 'container',
                    layout  : {type: 'hbox', align: 'stretch'},
                    items   : [
                        {
                            width: 35,
                            xtype: 'container',
                            style:  'background-color: #d9d9db;',
                            html: '<div ><i style="margin-top: 2px; float: left;" class="fa fa-chevron-circle-left fa-3x" aria-hidden="true"></i></div>'
                        },
                        {
                            flex: 1,
                            xtype: 'container',
                            itemId: 'northCtrMeal',
                            style:  'background-color: #d9d9db;',
                            layout  : {type: 'hbox', align: 'stretch'} 
                        },
                        {
                            width: 35,
                            xtype: 'container',
                            style:  'background-color: #d9d9db;',
                            html: '<div ><i style="margin-top: 2px; float: right;" class="fa fa-chevron-circle-right fa-3x" aria-hidden="true"></i></div>'
                        
                        }

                    ]
                }

            ]


    	},
    	centerContainer
    ],
    listeners: {
        painted: {
            element: 'el', //bind to the underlying el property on the panel
            fn: function(){

                var sampleData = {
                                    Dates : [
                                        {
                                            date: new Date('10/25/2016'),
                                            roomBlocks: 16,
                                            meetings: [
                                                {
                                                    start : 7,
                                                    end: 8,
                                                    name: 'Breakfast',
                                                    color: 'green'
                                                },
                                                {
                                                    start : 12,
                                                    end: 13,
                                                    name: 'Lunch',
                                                    color: 'green'
                                                },
                                                {
                                                    start : 18.5,
                                                    end: 20.5,
                                                    name: 'Dinner-Plated',
                                                    color: 'green'
                                                },
                                                {
                                                    start : 8,
                                                    end: 18,
                                                    name: 'Meeting',
                                                    color: 'orange'
                                                }
                                            ]
                                        },
                                        {
                                            date: new Date('10/26/2016'),
                                            roomBlocks: 0,
                                            meetings: [
                                                {
                                                    start : 7,
                                                    end: 8,
                                                    name: 'Breakfast',
                                                    color: 'green'
                                                },
                                                {
                                                    start : 12,
                                                    end: 13,
                                                    name: 'Lunch',
                                                    color: 'green'
                                                },
                                                {
                                                    start : 18.5,
                                                    end: 20.5,
                                                    name: 'Dinner-Plated',
                                                    color: 'green'
                                                },
                                                {
                                                    start : 8,
                                                    end: 18,
                                                    name: 'Meeting',
                                                    color: 'orange'
                                                }
                                            ]
                                        },
                                        {
                                            date: new Date('10/27/2016'),
                                            roomBlocks: 0,
                                            meetings: []
                                        },
                                        {
                                            date: new Date('10/28/2016'),
                                            roomBlocks: 0,
                                            meetings: []
                                        }
                                    ]
                                };
                observer.buildMeetings();
                observer.buildDates(sampleData);
                window.agendaBuilder.observer = observer;
            }
        }
    } 
})