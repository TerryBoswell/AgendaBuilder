Ext.ns('AgendaBuilder');
const agendaMode={Planner: 'planner', Hotel: 'hotel'};
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
	width: 900,
	style:  'margin:20px;',
    title:'Month Browser',
    itemId: 'MainContainer',
    cls : 'abMain',
    rfpNumber: null,
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
            cls     : 'fill-color'
        }
    ],
    listeners: {
        painted: {
            element: 'el', //bind to the underlying el property on the panel
            fn: function(cmp){
                if (observer.isInitialized)
                {
                    observer.clearAllCmps();
                    observer.destroy();
                    observer = Ext.create('AgendaBuilderObservable');
                }
                observer.isInitialized = true;
                observer.executeOverrides();
                Ext.Date.dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                observer.setScrollingHandlers();
                observer.setRfpNumber(cmp.component.rfpNumber);
                observer.setAgendaMode(cmp.component.agendaMode);
                observer.initAjaxController('https://etouches987.zentilaqa.com', observer);
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
            }
        }
    },
    addPreDays: function(count){
        this.observer.addPreDays(count);
    },
    addPostDays: function(count){
        this.observer.addPostDays(count);
    },
    setAgendaMode: function(mode){
        this.agendaMode = mode;
        this.observer.setAgendaMode(mode);
    }
})


