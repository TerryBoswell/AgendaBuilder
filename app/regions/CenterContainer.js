Ext.ns('AgendaBuilder');

var headingStyle = "background-color:#5c93ce; color: white;font-size:14px; text-align: center;";
var amStyle = "background-color: teal; height: 10px; padding-top: 5px;";
var pmStyle = "background-color: DarkSlateGray;";
Ext.define('CenterContainer', {
	extend: 'Ext.Container',
    layout: {type: 'vbox', align: 'stretch'},
    region: 'center',
    items: [
        Ext.create('AgendaRow', 
                {
                    height: 20,
                    defaultColStyle: '',
                    columns: [
                        {html: 'A', Index:7, style: 'font-size: medium; text-align: right;'}, 
                        {html: 'M', Index:8, style: 'font-size: medium; text-align: left;'},
                        {html: 'P', Index: 26, style: 'font-size: medium; text-align: right;'},
                        {html: 'M', Index: 27, style: 'font-size: medium; text-align: left;'}
                        ]
                }
        ),
    	Ext.create('AgendaRow', 
    			{
    				height: 15,
                    defaultColStyle: '',
    				columns: [
                        {style: amStyle, Index:2},
    					{style: amStyle, Index:3},{style: amStyle, Index:4}, 
    					{style: amStyle, Index:5},{style: amStyle, Index:6}, 
    					{style: amStyle, Index:7}, {style: amStyle, Index:8},
                        {style: amStyle, Index:9},{style: amStyle, Index:10}, 
                        {style: amStyle, Index:11},{style: amStyle, Index:12}, 
                        {style: amStyle, Index:13}, {style: pmStyle, Index:14}, 
    					{style: pmStyle, Index: 15}, {style: pmStyle, Index: 16}, 
    					{style: pmStyle, Index: 17}, {style: pmStyle, Index: 18}, 
    					{style: pmStyle, Index: 19}, {style: pmStyle, Index: 20}, 
    					{style: pmStyle, Index: 21}, {style: pmStyle, Index: 22}, 
    					{style: pmStyle, Index: 23}, {style: pmStyle, Index: 24}, 
    					{style: pmStyle, Index: 25}, {style: pmStyle, Index: 26}, 
                        {style: pmStyle, Index: 27}, {style: pmStyle, Index: 28}, 
                        {style: pmStyle, Index: 29}, {style: pmStyle, Index: 30}, 
                        {style: pmStyle, Index: 31}, {style: pmStyle, Index: 32}, 
                        {style: pmStyle, Index: 33}, {style: pmStyle, Index: 34}, 
                        {style: pmStyle, Index: 35}, {style: pmStyle, Index: 36}, 
                        {style: pmStyle, Index: 37},  
    					{html: '', style: 'background-color: grey;', Index: 38}
    					]
	  			}
		),
    	Ext.create('AgendaRow', 
    			{
    				height: 50,
                    defaultColStyle: headingStyle,
    				columns: [
                        {style: '', Index: 0} ,
    					{html: 'Room Block', style: 'font-size:medium;', Index: 1}, 
    					{html: '6', style: headingStyle, Index: 2},{html: '7', style: headingStyle, Index: 4}, 
    					{html: '8', style: headingStyle, Index: 6},{html: '9', style: headingStyle, Index: 8}, 
    					{html: '10', style: headingStyle, Index: 10}, {html: '11', style: headingStyle, Index: 12}, 
    					{html: '12', style: headingStyle, Index: 14}, {html: '1', style: headingStyle, Index: 16}, 
    					{html: '2', style: headingStyle, Index: 18}, {html: '3', style: headingStyle, Index: 20}, 
    					{html: '4', style: headingStyle, Index: 22}, {html: '5', style: headingStyle, Index: 24}, 
    					{html: '6', style: headingStyle, Index: 26}, {html: '7', style: headingStyle, Index: 28}, 
    					{html: '8', style: headingStyle, Index: 30}, {html: '9', style: headingStyle, Index: 32}, 
    					{html: '10', style: headingStyle, Index: 34}, {html: '11', style: headingStyle, Index: 36}, 
    					{html: '24hr Hold', style: headingStyle, Index: 38}
    					]
	  			}
		),
		{
			xtype	: 'container',
			height	: 400,
			style   : 'overflow-y: scroll;',
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
		
    ]

})