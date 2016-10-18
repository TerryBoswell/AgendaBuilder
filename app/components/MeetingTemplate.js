Ext.ns('AgendaBuilder');

Ext.define('MeetingTemplate',
	{
	extend: 'Ext.Container',
	height: 25,
	cls: 'meeting-item-type',
	observer: null,
	meeting: null,
    //width: 100,
    //html: '<div style="margin: 3px;padding:3px;">Meeting</div>',
    listeners: {
    	scope: this,
    	render: function(cmp, eOpts){
    		cmp.mon(cmp.el, 'mousedown', function(){
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
			        
			        var overrides = {
			        	 // Called the instance the element is dragged.
					        b4StartDrag : function() {
					            // Cache the drag element
					            if (!newCmp.el) {
					                newCmp.el = Ext.get(this.getEl());
					            }

					            //Cache the original XY Coordinates of the element, we'll use this later.
					        },
					        // Called when element is dropped in a spot without a dropzone, or in a dropzone without matching a ddgroup.
					        onInvalidDrop : function(target) {
					        	// Set a flag to invoke the animated repair
					            newCmp.invalidDrop = false;
					        },
					        // Called when the drag operation completes
					        endDrag : function(dropTarget) {
					        	var hasMatch = false;
					        	var cmps = Ext.query('#' + dropTarget.target.id);
					        	
					        	if (cmps && cmps.length)
					        	{
					        		var fly = (Ext.fly(cmps[0]));
					        		Ext.each(document.elementsFromPoint(fly.getX(), fly.getY()), function(el){
					        			if (el.id.indexOf('agendarow-ctr') != -1 && el.id.indexOf('col') != -1)
					        				console.dir(el);
					        		})
					        		hasMatch = true;
					        	}
					            // Invoke the animation if the invalidDrop flag is set to true
					            if (!hasMatch) {
					                // Remove the drop invitation
					                newCmp.el.removeCls('dropOK');

					                // Create the animation configuration object
					                var animCfgObj = {
					                    easing   : 'elasticOut',
					                    duration : 1,
					                    scope    : this,
					                    callback : function() {
					                        // Remove the position attribute
					                        newCmp.el.dom.style.position = '';
					                    }
					                };
					                // Apply the repair animation
					                newCmp.el.setXY(newCmp.originalXY[0], newCmp.originalXY[1], animCfgObj);
					                delete newCmp.invalidDrop;
					            }
					        },
					        onDragDrop : function(evtObj, targetElId) {
						        // Wrap the drop target element with Ext.Element
						        var dropEl = Ext.get(targetElId);

						        // Perform the node move only if the drag element's
						        // parent is not the same as the drop target
						        if (newCmp.el.dom.parentNode.id != targetElId) {

						            // Move the element
						            dropEl.appendChild(newCmp.el);

						            // Remove the drag invitation
						            newCmp.onDragOut(evtObj, targetElId);

						            // Clear the styles
						            newCmp.el.dom.style.position ='';
						            newCmp.el.dom.style.top = '';
						            newCmp.el.dom.style.left = '';
						        }
						        else {
						            // This was an invalid drop, initiate a repair
						            newCmp.onInvalidDrop();
						        }
						    }

			        };

			        var dd = Ext.create('Ext.dd.DD', newCmp, 'meetingDate', {
			                isTarget  : false
		            });
			       Ext.apply(dd, overrides);

			       dd.startDrag(newCmp.getX(), newCmp.getY());
			        
        		});
    	},
        painted: {
            element: 'el', //bind to the underlying el property on the panel
            fn: function(cmp){
            	
            }
        }
    }
})