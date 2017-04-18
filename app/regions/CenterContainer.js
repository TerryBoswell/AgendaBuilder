Ext.ns('AgendaBuilder');

var headingStyleAM = "background-color:grey;";
var headingStylePM = "background-color:grey;";
var amStyle = "background-color: teal; height: 10px; padding-top: 5px;";
var pmStyle = "background-color: DarkSlateGray;";
Ext.define('CenterContainer', {
	extend: 'Ext.Container',
	cls: 'centerCtr',
	layout: {type: 'vbox', align: 'stretch'},
    region: 'center',
    items: [
        Ext.create('AgendaRow', 
    			{
    				height: 50,
                    defaultColStyle: headingStyleAM,
					defaultColClass: 'arHeader',
					columns: [
                        {style: 'border-bottom: 1px solid black !important;', Index: 0} ,
    					{html: '<span class="guestRoom">Guest Rooms</span>', style: 'border-bottom: 1px solid black !important;', Index: 1}, 
    					{html: '<span class="amhourText">6</span>', style: headingStyleAM, Index: 2},{html: '<span class="amhourText">7</span>', style: headingStyleAM, Index: 4}, 
    					{html: '<span class="amhourText">8</span>', style: headingStyleAM, Index: 6},
						{html: '<span class="amFirst">A</span>', style: headingStyleAM, Index: 7}, 
						{html: '<span class="amSecond">M</span><span class="amhourText">9</span>', style: headingStyleAM, Index: 8}, 
    					{html: '<span class="amhourText">10</span>', style: headingStyleAM, Index: 10}, {html: '<span class="amhourText">11</span>', style: headingStyleAM, Index: 12}, 
    					{html: '<span class="pmhourText">12</span>', style: headingStylePM, Index: 14}, {html: '', style: headingStylePM, Index: 15},
						{html: '<span class="pmhourText">1</span>', style: headingStylePM, Index: 16}, {html: '', style: headingStylePM, Index: 17},
    					{html: '<span class="pmhourText">2</span>', style: headingStylePM, Index: 18}, {html: '', style: headingStylePM, Index: 19}, 
						{html: '<span class="pmhourText">3</span>', style: headingStylePM, Index: 20}, {html: '', style: headingStylePM, Index: 21},
    					{html: '<span class="pmhourText">4</span>', style: headingStylePM, Index: 22}, {html: '', style: headingStylePM, Index: 23},
						{html: '<span class="pmhourText">5</span>', style: headingStylePM, Index: 24}, {html: '', style: headingStylePM, Index: 25},
    					{html: '<span class="pmhourText">6</span>', style: headingStylePM, Index: 26}, {html: '<span class="pmFirst">P</span>', style: headingStylePM, Index: 27},
						{html: '<span class="pmSecond">M</span><span class="pmhourText">7</span>', style: headingStylePM, Index: 28}, {html: '', style: headingStylePM, Index: 29},
    					{html: '<span class="pmhourText">8</span>', style: headingStylePM, Index: 30}, {html: '', style: headingStylePM, Index: 31},
						{html: '<span class="pmhourText">9</span>', style: headingStylePM, Index: 32}, {html: '', style: headingStylePM, Index: 33},
    					{html: '<span class="pmhourText">10</span>', style: headingStylePM, Index: 34}, {html: '', style: headingStylePM, Index: 35},
						{html: '<span class="pmhourText">11</span>', style: headingStylePM, Index: 36}, {html: '', style: headingStylePM, Index: 37},
    					{html: '24hr Hold', style: 'background-color: grey; color: white;font-size:12pt; text-align: center; border-bottom: 1px solid black;', Index: 38}
    					]
	  			}
		),
		{
			xtype	: 'container',
			style   : 'overflow-x: hidden;padding-bottom: 110px !important;',
			itemId	: 'datesCtr',
			layout	: {
							type	: 'vbox',
							align	: 'stretch'

			}
		}
		
    ],
	listeners: {
		scope: this,
		delay: 2000,
		afterrender: function(){
			Ext.each(Ext.query('.x-css-shadow'), function(el){
				var child = Ext.fly(el);
				var parent = child.parent();
				parent.removeChild(child);
			});
		}
	}

})