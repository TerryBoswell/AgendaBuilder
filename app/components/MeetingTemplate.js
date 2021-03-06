Ext.ns('AgendaBuilder');

Ext.define('MeetingTemplate',
	{
	extend: 'Ext.Container',
	height: 25,
	cls: 'meeting-item-type',
	observer: null,
	meeting: null,
    listeners: {
    	scope: this,
    	render: function(cmp, eOpts){
			var observer = this.observer;
    		cmp.mon(cmp.el, 'mousedown', function(e){
    				var overrides = [];
    				var newCmp = Ext.create('Ext.Component', {
			            html: cmp.template.apply(cmp.meeting),
			            style: cmp.style + ';z-index: 10000;',
			            floating: true,
			            height : cmp.getHeight(),
			            width: cmp.getWidth(),
			            x: cmp.getX(),
			            y: cmp.getY(),
			            renderTo: Ext.getBody(),
			            meeting: cmp.meeting,
			            originalXY: cmp.getXY()
			        });
					//Mask the other elements when the drag and drop meeting is created
			        Ext.ComponentQuery.query('#MainContainer')[0].el.mask();
					Ext.ComponentQuery.query('#northCtrMeal')[0].el.mask();
					Ext.ComponentQuery.query('#northCtrMtg')[0].el.mask();		
					Ext.each(Ext.query('.meeting-item-type'), function(e){
						Ext.fly(e).el.mask();
					});
					var overrides = {
			        	 // Called the instance the element is dragged.
					        b4StartDrag : function() {
								newCmp.dragEnded = false;
								Ext.each(observer.meetingCallouts, function(callout){
									callout.hide();
								})
					            // Cache the drag element
					            if (!newCmp.el) {
					                newCmp.el = Ext.get(this.getEl());
					            }
								observer.currentDragMtg = -1;
					            //Cache the original XY Coordinates of the element, we'll use this later.
					        },
					        // Called when element is dropped in a spot without a dropzone, or in a dropzone without matching a ddgroup.
					        onInvalidDrop : function(target) {
					        	// Set a flag to invoke the animated repair
								newCmp.invalidDrop = false;
								observer.currentDragMtg = null;
					        },
							onMouseUp: function(e){
								if (newCmp.dragEnded)
									return;
								 Ext.ComponentQuery.query('#MainContainer')[0].el.unmask();
								 Ext.ComponentQuery.query('#northCtrMeal')[0].el.unmask();
								 Ext.ComponentQuery.query('#northCtrMtg')[0].el.unmask();		
								 Ext.each(Ext.query('.meeting-item-type'), function(e){
										Ext.fly(e).el.unmask();
								  });
								 newCmp.destroy();
							},
					        // Called when the drag operation completes
					        endDrag : function(dropTarget) {
								observer.currentDragMtg = null;
								newCmp.dragEnded = true;
								var match = null;
								var browserEvent = null;
								if (dropTarget && dropTarget.parentEvent && dropTarget.parentEvent.browserEvent)
								{
									browserEvent = dropTarget.parentEvent.browserEvent;
								}
								else if (dropTarget && dropTarget.browserEvent)
								{
									browserEvent = dropTarget.browserEvent;
								}
								if (browserEvent == null)
								{
									throw("Cannoth find browserEvent");									
								}
								var rect = newCmp.el.dom.getBoundingClientRect();
								var y = (rect.top + rect.bottom) / 2; //We'll get the center

								//Now let's  find the starting timeslot
								var startingPoint = rect.left + 1; //shifted one pixel to make sure we are on the starting block 
								Ext.each(document.elementsFromPoint(startingPoint, y), function(el){
									if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1 && el.dataset.date)
										match = el;
								})
								var instance = null;
								if (match && match.dataset && match.dataset.date)
								{
									var instanceDate = observer.createDate(match.dataset.date.stripInvalidChars());
									instance = observer.getInstance(instanceDate, observer);
								}
								// Invoke the animation if the invalidDrop flag is set to true
					            if (match == null || !match.dataset || !match.dataset.date || !match.dataset.hour || (
									instance && instance.visible == false)) {
					                // Remove the drop invitation
					                newCmp.el.removeCls('dropOK');

					                // Create the animation configuration object
					                var animCfgObj = {
					                    easing   : 'elasticOut',
					                    duration : 100,
					                    scope    : this,
					                    callback : function() {
											Ext.ComponentQuery.query('#MainContainer')[0].el.unmask();
											Ext.ComponentQuery.query('#northCtrMeal')[0].el.unmask();
											Ext.ComponentQuery.query('#northCtrMtg')[0].el.unmask();		
											Ext.each(Ext.query('.meeting-item-type'), function(e){
												Ext.fly(e).el.unmask();
											});
					                        newCmp.destroy();
					                    }
					                };
					                // Apply the repair animation
					                newCmp.setPosition(cmp.getXY()[0], cmp.getXY()[1], animCfgObj);
					                delete newCmp.invalidDrop;
					            }
								else{
									var meetingTemplate = (cmp.meeting);
									var d = new Date(match.dataset.date.stripInvalidChars() + ' ' + match.dataset.hour.stripInvalidChars());
									var end = Ext.Date.add(d, Ext.Date.MINUTE, meetingTemplate.default_duration);
									var start = match.dataset.hour;
									if (!observer.areTwoDatesEqual(d, end))
									{
										end = new Date(match.dataset.date.stripInvalidChars() + ' 23:59:00');
										//var calcStart = Ext.Date.subtract(end, Ext.Date.MINUTE, meetingTemplate.default_duration - 1); //subtract one min so we offset the minute before Midnight
										//start = Ext.Date.format(calcStart, "H:i:00")
									}
									var color = "#" + meetingTemplate.color;
									var meeting = observer.createMeeting(0, observer.createDate(match.dataset.date.stripInvalidChars()), start, Ext.Date.format(end, 'H:i:s'), 
										meetingTemplate.title, 'white', 
										color, 0, observer, meetingTemplate);
									Ext.ComponentQuery.query('#MainContainer')[0].el.unmask();
									Ext.ComponentQuery.query('#northCtrMeal')[0].el.unmask();
									Ext.ComponentQuery.query('#northCtrMtg')[0].el.unmask();		
									Ext.each(Ext.query('.meeting-item-type'), function(e){
										Ext.fly(e).el.unmask();
									});
									observer.showMeetingEditor(meeting, observer, meetingTemplate, d, newCmp.getY());
									newCmp.destroy();
								}
					        }

			        };

			        var dd = Ext.create('Ext.dd.DD', newCmp, 'meetingDate', {
			                isTarget  : false
		            });
			       Ext.apply(dd, overrides);
				    dd.setStartPosition();
					dd.b4MouseDown(e);
					dd.onMouseDown(e);
	
					dd.DDMInstance.handleMouseDown(e, dd);
	
					dd.DDMInstance.stopEvent(e);


        		});
    	}
    }
})