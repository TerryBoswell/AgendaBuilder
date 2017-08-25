Ext.ns('AgendaBuilder');
const agendaMode={Planner: 'planner', Hotel: 'hotel'};
const timeRegEx= /(01|1|02|2|03|3|04|4|05|5|06|6|07|7|08|8|09|9|10|11|12):?(00|30)\s?(?:AM|am|Am|aM|PM|pm|Pm|pM)/;
var centerContainer = Ext.create('CenterContainer');

var observer = Ext.create('AgendaBuilderObservable');

var extVersion = Ext.getVersion('extjs');
if (extVersion.major != 6 || extVersion.minor != 0)
{
    var msg = extVersion.version + " is not a supported extjs version";
    alert(msg);
    throw msg;
}
window.agendaBuilder = {};
Ext.define('AgendaBuilder.MainContainer', {
    observer: observer,
	extend: 'Ext.Container',
	width: 960,
	style:  'margin:20px;',
    title:'Month Browser',
    itemId: 'MainContainer',
    cls : 'abMain',
    rfpNumber: null,
    numberOfPeople: null,
    apiUrl: 'https://etouches987.zentilaqa.com',
    agendaMode: agendaMode.Planner,
    items: [
    	{
    		xtype	: 'container',
    		//region	: 'north',
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
                            itemId: 'leftNorthCtrMtg',
                            cls: 'btn-disable',
                            style:  'background-color: #d9d9db;z-index:1000;',
                            html: '<div ><i style="margin-top: 2px; margin-left: 2px; float: left;" class="fa fa-btn fa-chevron-circle-left fa-3x" aria-hidden="true"></i></div>'
                        },
                        {
                            flex: 1,
                            xtype: 'container',
                            itemId: 'northCtrMtg',
                            style:  'background-color: #d9d9db;z-index:1000;',
                            layout  : {type: 'hbox', align: 'stretch'} 
                        },
                        {
                            width: 35,
                            xtype: 'container',
                            itemId: 'rightNorthCtrMtg',
                            style:  'background-color: #d9d9db;z-index:1000;',
                            html: '<div ><i style="margin-top: 2px; margin-right: 2px; float: right;" class="fa fa-btn fa-chevron-circle-right fa-3x" aria-hidden="true"></i></div>'
                        
                        }

                    ]
                },
                {
                    xtype   : 'container',
                    height: 5,
                    cls: 'fill-color'
                },
                {
                    flex: 1,
                    xtype: 'container',
                    layout  : {type: 'hbox', align: 'stretch'},
                    items   : [
                        {
                            width: 35,
                            xtype: 'container',
                            itemId: 'leftNorthCtrMeal',
                            cls: 'btn-disable',
                            style:  'background-color: #d9d9db;z-index:1000;',
                            html: '<div ><i style="margin-top: 2px; margin-left: 2px; float: left;" class="fa fa-btn fa-chevron-circle-left fa-3x" aria-hidden="true"></i></div>'
                        },
                        {
                            flex: 1,
                            xtype: 'container',
                            itemId: 'northCtrMeal',
                            style:  'background-color: #d9d9db;z-index:1000;',
                            layout  : {type: 'hbox', align: 'stretch'}
                        },
                        {
                            width: 35,
                            xtype: 'container',
                            itemId: 'rightNorthCtrMeal',
                            style:  'background-color: #d9d9db;z-index:1000;',
                            html: '<div ><i style="margin-top: 2px; margin-right: 2px; float: right;" class="fa fa-btn fa-chevron-circle-right fa-3x" aria-hidden="true"></i></div>'
                        
                        }

                    ]
                },
                {
                    xtype   : 'container',
                    height: 5,
                    cls: 'fill-color'
                }

            ]


    	},
    	centerContainer,
        {
            xtype   : 'container',
            itemId  : 'versionbox',
            height  : 5,
            cls     : 'fill-color',
            listeners: {
                scope : this,
                delay   : 100,
                render : function(c){
                    Ext.ComponentQuery.query('#versionbox')[0].mon(Ext.ComponentQuery.query('#versionbox')[0].el, 'click', function(){
                        observer.logDatabase.readAll(function(errors){
                            if (!errors || !errors.length)
                                return;
                            var data = [];
                            Ext.each(errors, function(e){
                                data.push(e.value);
                            })
                            var html = new Ext.XTemplate(
                                '<table border="1" style="width:100%;display:block;height:100%;overflow:scroll;">',
                                    '<col width="75px" max-width="75px"/>',
                                    '<col width="325px" max-width="325px"/>',
                                    '<tr>',
                                        '<th>Id</th>',
                                        '<th>Error</th>',
                                    '</tr>',    
                                    '<tpl for=".">',
                                        '<tr>',
                                            '<td>{id}</td>',
                                            '<td>{msg}</td>',
                                        '</tr>',
                                    '</tpl>',
                                    				                                    
                                '</table>',
                                {
                                    strict: true
                            }).apply(data);
                            window.tempdata = data;
                            new Ext.Window({
                                modal:true,
                                height: 400,
                                width: 400,
                                layout: 'fit',
                                items: [
                                    {
                                        xtype: 'box',
                                        html: html
                                    }
                                ]
                            }).show();
                        });
                    });
                }

            }
        }
    ],
    listeners: {
        painted: {
            element: 'el', //bind to the underlying el property on the panel
            fn: function(cmp){
                cmp.component.refresh();
            }
        }
    },
    addPreDays: function(count){
        observer.addPreDays(count);
    },
    addPostDays: function(count){
        observer.addPostDays(count);
    },
    setAgendaMode: function(mode){
        this.agendaMode = mode;
        observer.setAgendaMode(mode);
    },
    setNumberOfPeople: function(n){
        observer.setNumberOfPeople(n);
    },
    pushBackFocus: function(){
        observer.pushBackFocus(observer);
    },
    refresh: function(){
        var cmp = Ext.ComponentQuery.query('#MainContainer')[0];
        if (observer.isInitialized)
                {
                    observer.clearAllCmps();
                    observer.destroy();
                    observer = Ext.create('AgendaBuilderObservable');
                    observer.agendaBuilderRows = [];
                }
                observer.isInitialized = true;
                observer.executeOverrides();
                Ext.Date.dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                new Ext.util.DelayedTask(function(){
                    observer.setScrollingHandlers();
                }).delay(500); 
                observer.setRfpNumber(cmp.rfpNumber);
                observer.setNumberOfPeople(cmp.numberOfPeople);
                observer.setAgendaMode(cmp.agendaMode);
                observer.initAjaxController(cmp.apiUrl, observer);
                observer.initDatabase(observer);
                observer.getRoomSetups();
                observer.on({
                    scope: this,
                    getroomsetups: function(){
                        observer.getMeetingItemTypes();
                    },
                    getmeetingitems : function(data){
                        observer.buildDates(data);
                    },
                    getmeetingitemtypes: function(){
                        observer.getMeetingItems();
                    }
                })
                Ext.each(Ext.query('.arHeader'), function(el){
                    el.addEventListener('mouseover', function(evt){
                        if (observer.currentDragMtg && observer.currentDragDrop)
                        {
                            observer.currentDragDrop.endDrag(evt, true, observer.currentDragMtg);
                        }
                    })	
                });
                Ext.ComponentQuery.query('#versionbox')[0].update('<div style="padding-bottom:10px;">Version:' + observer.version + '</div>')
                window.agendaBuilder.observer = observer;  
                window.onblur = function(evt) {
                    if (observer && observer.currentDragDrop && observer.currentDragDrop.endDrag)
	                    observer.currentDragDrop.endDrag(evt, true, observer.currentDragMtg, true);
	            };
    }
})


