const maxValsForNine = 999999999;
var baseConfig = {
    extend  : 'Ext.Container',
    cls     : 'roomLayout',
    height  : 80,
    width   : 80,
    selected: false,
    clickHandler: null,
    mouseOverHandler: null,
    mouseOutHandler: null,
    extender: null,
    renderExtender: function(target, postRender){
            //No items have been specified to go into the extender
            if (!target.extenderRadios && !target.extenderInput)
                return;
            if (!target.el || !target.el.dom)
                return;
            var targetX = target.getX();
            //we need to get the parent target center
            var targetCenter = targetX + (target.getWidth()/2);
            Ext.each(Ext.query('.extender'), function(e){
                var c = Ext.getCmp(e.id);
                if (c && c.destroy)
                    c.destroy();
            });
            target.extender = Ext.create('Ext.Component', {
                html: '<div id="' + target.itemId +'div" class="expand"></div>',
                style: 'background: rgba(1, 0, 0, 0);padding-top: 12px;',
                cls: 'invisible extender',
                target: target,
                floating: true,
                x:targetCenter,
                y: 90,
                renderTo : target.ownerCt.ownerCt.el,
                extenderHeight: target.extenderHeight,
                extenderRadios: target.extenderRadios,
                extenderInput: target.extenderInput,
                listeners: {
                    painted: {
                        element: 'el', //bind to the underlying el property on the panel
                        fn: function(cmpEl){
                            var cmp = Ext.getCmp(cmpEl.id);
                            new Ext.util.DelayedTask(function(){
                                var targetX = cmp.target.getX();
                                //we need to get the parent target center
                                var targetCenter = targetX + (cmp.target.getWidth()/2);
                                //so the x coordinate will center of the parent - half the width of cmp
                                var x = targetCenter - (cmp.getWidth() / 2);
                                cmp.setPosition(x, 90);
                                cmp.setX(x);
                                //We need to align any radios to make sure they are spaced
                                Ext.each(Ext.query('.x-form-type-radio'), function(r){
                                    Ext.fly(r).setWidth(110);
                                })

                                //if an over-ride height is provided, we use it
                                if (cmp.extenderHeight)
                                    cmp.el.down('.expand').setHeight(cmp.extenderHeight);
                                //We make it completely invisible with opacity and after the move, show it
                                cmp.removeCls('invisible');
                            }).delay(1);        
                        }
                    },
                    afterrender: function(tEl)
                    {
                        var extenderId = '#' + target.itemId +'div';
                        var expandEl =  Ext.query(extenderId)[0];
                        
                        if (tEl.extenderRadios)
                        {
                            Ext.create('Ext.form.RadioGroup', {
                                height: 80,
                                width: 220,
                                itemId: 'extenderRadioGroup',
                                renderTo : expandEl,
                                style: 'z-index: 99999;',
                                columns: 2,
                                vertical: true,
                                padding: 5,
                                items: tEl.extenderRadios
                            })
                        }
                        else
                        {
                            Ext.create('Ext.Container', {
                                height: 80,
                                width: 200,
                                itemId: 'extenderInput',
                                renderTo : expandEl,
                                layout: {
                                    type : 'vbox',
                                    align: 'stretch'
                                },
                                style: 'z-index: 99999;',
                                items: tEl.extenderInput,
                                style: 'padding: 0px 5px;'
                            })

                        }
                        if (postRender && Ext.isFunction(postRender))
                            postRender();
                    }
                }
            })
            
    },
    listeners: {
        scope: this,
        render  : function(cmp, eOpts){
            var observer = this.observer;
            cmp.mon(cmp.el, 'mouseover', function(e){
                if (cmp.mouseOverHandler)
                    cmp.mouseOverHandler(cmp, e);
            })
            cmp.mon(cmp.el, 'mouseout', function(e){
                if (cmp.mouseOutHandler)
                    cmp.mouseOutHandler(cmp, e);
            })
            cmp.mon(cmp.el, 'click', function(e){
                if (cmp.clickHandler)
                    cmp.clickHandler(cmp, e);
                if (cmp.renderExtender)
                    cmp.renderExtender(cmp);
            })
            
        }
    }
};

var numericChange = function(cmp, newValue, oldValue) 
{
    var value = parseInt(newValue);
    if (isNaN(value))
        cmp.setValue(0);
    if (value < 0)
        cmp.setValue(0);
    if (newValue != value)
    {
        if (newValue == null)
            cmp.setValue(0);
        else if (isNaN(value))
            cmp.setValue(0);
        else
            cmp.setValue(value);
    }
};

Ext.define('squarelayout', Ext.apply({
        itemId: 'squarelayout',
        html: 
            '<img class="img-roomlayout" src="app/images/square.png">' +
            '<div class="layoutName img-banquet">Square</img></div>',
        getValue: function(){return '13'},
        values: function(){return ['13']}
    }, baseConfig)
);

Ext.define('ushapelayout', Ext.apply({
        itemId: 'ushapelayout',
        html: '<img class="img-roomlayout" src="app/images/u-shape.png" >' +
              '<div class="layoutName">U Shape</div>',
        getValue: function(){return '1'},
        values: function(){return ['1']}
    }, baseConfig)
);

Ext.define('roundlayout', Ext.apply({
        itemId: 'roundlayout',
        html: '<img class="img-roomlayout" src="app/images/banquet.png">' +
                '<div class="layoutName">Rounds</div>',
        extenderHeight: 60,
        extenderRadios : [
            { boxLabel: 'Rounds of 8', name: 'rb', inputValue: '2', checked: true },
            { boxLabel: 'Rounds of 10', name: 'rb', inputValue: '3'},
            { boxLabel: 'Crescent Rounds', width: 150, name: 'rb', inputValue: '12'}
            ],
        getValue: function(){
            var cmp = Ext.ComponentQuery.query('#extenderRadioGroup')[0];
            if (!cmp)
                return null;
            return cmp.getValue().rb
        },
        values: function(){return ['2','3','12']}
    }, baseConfig)
);

Ext.define('cocktaillayout', Ext.apply({
        itemId: 'cocktaillayout',
        html: '<img class="img-roomlayout" src="app/images/cocktail.png">' +
                '<div class="layoutName">Cocktail</div>',
        getValue: function(){return '5'},
        values: function(){return ['5']}
    }, baseConfig)
);

Ext.define('theaterlayout', Ext.apply({
        itemId: 'theaterlayout',
        html: '<img class="img-roomlayout" src="app/images/theater.png">' +
                '<div class="layoutName">Theater</div>',
        getValue: function(){return '4'},
        values: function(){return ['4']}
    }, baseConfig)
);

Ext.define('classroomlayout', Ext.apply({
        itemId: 'classroomlayout',
        html: '<img class="img-roomlayout" src="app/images/classroom.png">' +
                '<div class="layoutName">Classroom</div>',
        extenderHeight: 40,
        extenderRadios : [
            { boxLabel: '2 per 6ft', name: 'rb', inputValue: '6' , checked: true},
            { boxLabel: '3 per 6ft', name: 'rb', inputValue: '7'}
            ],
        getValue: function(){
            var cmp = Ext.ComponentQuery.query('#extenderRadioGroup')[0];
            if (!cmp)
                return null;
            return cmp.getValue().rb
        },
        values: function(){return ['6','7']}
    }, baseConfig)
);

Ext.define('boardroomlayout', Ext.apply({
        itemId: 'boardroomlayout',
        html: '<img class="img-roomlayout" src="app/images/boardroom.png">' +
                '<div class="layoutName">Boardroom</div>',
        getValue: function(){return '8'},
        values: function(){return ['8']}
    }, baseConfig)
);

Ext.define('boothlayout', Ext.apply({
        itemId: 'boothlayout',
        html: '<img class="img-roomlayout" src="app/images/booths.png">' +
                '<div class="layoutName">Booth</div>',
        extenderInput : [{xtype: 'box', height: 1},
                {xtype: 'displayfield', value: 'Please answer at least one:', height: 18, style: 'z-index: 1001;'},
                {xtype: 'box', height: 1},
                {xtype: 'numberfield', itemId: 'boothsqft', fieldLabel  : 'Sq. ft. needed', minValue    : 0, value       : 0, 
                    maxValue: maxValsForNine, height: 20,
                    msgTarget   : 'none', 
                    listeners: {change: numericChange}
                    },
                {xtype: 'box', height: 1},
                {xtype: 'numberfield', itemId: 'boothcount', fieldLabel  : '# of booths', minValue    : 0, value       : 0, 
                    maxValue: maxValsForNine, height: 20,
                    msgTarget   : 'none', listeners: {change: numericChange}},
                {xtype: 'box', height: 5}
                ],
        getValue: function(){return '9'},
        values: function(){return ['9']},
        getAdditionalInfo: function(){
            var bt = Ext.ComponentQuery.safeGetValue('#boothcount', 0);
            var sqft = Ext.ComponentQuery.safeGetValue('#boothsqft', 0);
            return {square_feet : sqft, booths: bt};
        },
        setAdditionalInfo: function(square_feet, tabletops, posters, booths){
            Ext.ComponentQuery.safeSetValue('#boothcount', booths);
            Ext.ComponentQuery.safeSetValue('#boothsqft', square_feet);
        }
        
    }, baseConfig)
);


Ext.define('posterlayout', Ext.apply({
        itemId: 'posterlayout',
        html: '<img class="img-roomlayout" src="app/images/posters.png">' +
                '<div class="layoutName">Poster</div>',
        extenderInput : [{xtype: 'box', height: 1},
                {xtype: 'displayfield', value: 'Please answer at least one:', height: 18, style: 'z-index: 1001;'},
                {xtype: 'box', height: 1},
                {xtype: 'numberfield', itemId: 'postersqft', fieldLabel  : 'Sq. ft. needed', minValue    : 0, value       : 0, 
                    maxValue: maxValsForNine , height: 20,
                    msgTarget   : 'none', listeners: {change: numericChange}},
                {xtype: 'box', height: 1},
                {xtype: 'numberfield', itemId: 'postercount', fieldLabel  : '# of posters', minValue    : 0, value       : 0, 
                    maxValue: maxValsForNine , height: 20,
                    msgTarget   : 'none', listeners: {change: numericChange}},
                {xtype: 'box', height: 5}
                ],
        getValue: function(){return '10'},
        values: function(){return ['10']},
        getAdditionalInfo: function(){
            var ct = Ext.ComponentQuery.safeGetValue('#postercount', 0);
            var sqft = Ext.ComponentQuery.safeGetValue('#postersqft', 0);
            return {square_feet : sqft, posters: ct};
        },
        setAdditionalInfo: function(square_feet, tabletops, posters, booths){
            Ext.ComponentQuery.safeSetValue('#postercount', posters);
            Ext.ComponentQuery.safeSetValue('#postersqft', square_feet);
        }
    }, baseConfig)
);

Ext.define('tabletoplayout', Ext.apply({
        itemId: 'tabletoplayout',
        html: '<img class="img-roomlayout" src="app/images/tabletops.png">' +
                '<div class="layoutName">Table Top</div>',
        extenderInput : [{xtype: 'box', height: 1},
                {xtype: 'displayfield', value: 'Please answer at least one:', height: 18, style: 'z-index: 1001;'},
                {xtype: 'box', height: 1},
                {xtype: 'numberfield', itemId: 'tabletopsqft', fieldLabel  : 'Sq. ft. needed', minValue    : 0, value       : 0, 
                    maxValue: maxValsForNine , height: 20,
                    msgTarget   : 'none', listeners: {change: numericChange}},
                {xtype: 'box', height: 1},
                {xtype: 'numberfield', itemId: 'tabletopcount', fieldLabel  : '# of table tops', minValue    : 0, value       : 0, 
                    maxValue: maxValsForNine , height: 20,
                    msgTarget   : 'none', listeners: {change: numericChange}},
                {xtype: 'box', height: 5}
                ],
        getValue: function(){return '14'},
        values: function(){return ['14']},
        getAdditionalInfo: function(){
            var ct = Ext.ComponentQuery.safeGetValue('#tabletopcount', 0);
            var sqft = Ext.ComponentQuery.safeGetValue('#tabletopsqft', 0);
            return {square_feet : sqft, tabletops: ct};
        },
        setAdditionalInfo: function(square_feet, tabletops, posters, booths){
            Ext.ComponentQuery.safeSetValue('#tabletopcount', tabletops);
            Ext.ComponentQuery.safeSetValue('#tabletopsqft', square_feet);
        }
    }, baseConfig)
);

Ext.define('nonelayout', Ext.apply({
        itemId: 'nonelayout',
        html: '<div class="layoutName">None</div>',
        values: function(){return ['11']},
        getValue: function(){return '11'}
    }, baseConfig)
);