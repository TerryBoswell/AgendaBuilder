Ext.ns('AgendaBuilder');

var headingStyleAM = "background-color:teal;";
var headingStylePM = "background-color:DarkSlateGray;";
var amStyle = "background-color: teal; height: 10px; padding-top: 5px;";
var pmStyle = "background-color: DarkSlateGray;";
Ext.define('CenterContainer', {
	extend: 'Ext.Container',
    layout: {type: 'vbox', align: 'stretch'},
    region: 'center',
    items: [
        Ext.create('AgendaRow', 
    			{
    				height: 50,
                    defaultColStyle: headingStyleAM,
    				columns: [
                        {style: '', Index: 0} ,
    					{html: 'Room Block', style: 'font-size:medium;', Index: 1}, 
    					{html: '<span class="hourText">6</span>', style: headingStyleAM, Index: 2},{html: '<span class="hourText">7</span>', style: headingStyleAM, Index: 4}, 
    					{html: '<span class="hourText">8</span>', style: headingStyleAM, Index: 6},
						{html: '<span class="amPMFirst">A</span>', style: headingStyleAM, Index: 7}, 
						{html: '<span class="amPMSecond">M</span><span class="hourText">9</span>', style: headingStyleAM, Index: 8}, 
    					{html: '<span class="hourText">10</span>', style: headingStyleAM, Index: 10}, {html: '<span class="hourText">11</span>', style: headingStyleAM, Index: 12}, 
    					{html: '<span class="hourText">12</span>', style: headingStylePM, Index: 14}, {html: '', style: headingStylePM, Index: 15},
						{html: '<span class="hourText">1</span>', style: headingStylePM, Index: 16}, {html: '', style: headingStylePM, Index: 17},
    					{html: '<span class="hourText">2</span>', style: headingStylePM, Index: 18}, {html: '', style: headingStylePM, Index: 19}, 
						{html: '<span class="hourText">3</span>', style: headingStylePM, Index: 20}, {html: '', style: headingStylePM, Index: 21},
    					{html: '<span class="hourText">4</span>', style: headingStylePM, Index: 22}, {html: '', style: headingStylePM, Index: 23},
						{html: '<span class="hourText">5</span>', style: headingStylePM, Index: 24}, {html: '', style: headingStylePM, Index: 25},
    					{html: '<span class="hourText">6</span>', style: headingStylePM, Index: 26}, {html: '<span class="amPMFirst">P</span>', style: headingStylePM, Index: 27},
						{html: '<span class="amPMSecond">M</span><span class="hourText">7</span>', style: headingStylePM, Index: 28}, {html: '', style: headingStylePM, Index: 29},
    					{html: '<span class="hourText">8</span>', style: headingStylePM, Index: 30}, {html: '', style: headingStylePM, Index: 31},
						{html: '<span class="hourText">9</span>', style: headingStylePM, Index: 32}, {html: '', style: headingStylePM, Index: 33},
    					{html: '<span class="hourText">10</span>', style: headingStylePM, Index: 34}, {html: '', style: headingStylePM, Index: 35},
						{html: '<span class="hourText">11</span>', style: headingStylePM, Index: 36}, {html: '', style: headingStylePM, Index: 37},
    					{html: '24hr Hold', style: 'background-color: grey; color: white;font-size:14px; text-align: center;', Index: 38}
    					]
	  			}
		),
		{
			xtype	: 'container',
			height	: 400,
			style   : '-y: scroll; overflow-x: hidden;',
			itemId	: 'datesCtrParent',
			items	: [
					{
						xtype	: 'container',
						itemId	: 'datesCtr',
						//style   : 'overflow-y: scroll;',
						layout	: {
							type	: 'vbox',
							align	: 'stretch'
						},
						//height	: 400
					}

			]
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