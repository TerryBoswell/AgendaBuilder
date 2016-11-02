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
    renderExtender: function(target){
            //No items have been specified to go into the extender
            if (!target.extenderItems)
                return;
            var targetPos = target.el.dom.getElementsByClassName('layoutName')[0].getBoundingClientRect();
            var pPos = target.ownerCt.ownerCt.el.dom.getBoundingClientRect();
            var centerPos = (targetPos.width / 2) + targetPos.x - pPos.left;
            target.extender = Ext.create('Ext.Container', {
                html: '<div id="' + target.itemId +'div" class="expand"></div>',
                style: 'background: rgba(1, 0, 0, 0);padding-top: 12px',
                target: target,
                floating: true,
                renderTo : target.ownerCt.ownerCt.el,
                listeners: {
                    afterrender: function(tEl)
                    {
                        var x = centerPos - (tEl.getWidth()/2); //We need to adjust from the center position of the target element minus half the width of the extender
                        tEl.setPosition(x, 90);
                    }
                }
            })
            target.ownerCt.ownerCt.el.dom.getElementsByClassName('x-css-shadow')[0].style.boxShadow=null;
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
        },
        beforehide: function(){           
        },
        beforeremove: function(){           
        }
    }
};



Ext.define('squarelayout', Ext.apply({
        itemId: 'squarelayout',
        html: 
            '<img class="img-roomlayout" src="app/images/boardroom.png">' +
            '<div class="layoutName img-banquet">Square</img></div>'
    }, baseConfig)
);

Ext.define('ushapelayout', Ext.apply({
        itemId: 'ushapelayout',
        html: '<img class="img-roomlayout" src="app/images/u-shape.png" >' +
              '<div class="layoutName">U Shape</div>'
    }, baseConfig)
);

Ext.define('roundlayout', Ext.apply({
        itemId: 'roundlayout',
        html: '<img class="img-roomlayout" src="app/images/banquet.png">' +
                '<div class="layoutName">Rounds</div>',
        extenderItems : [{
                    xtype: 'radiogroup',
                    // Arrange radio buttons into two columns, distributed vertically
                    columns: 2,
                    vertical: true,
                    bodyPadding: 10,
                    items: [
                        { boxLabel: 'Item 1', name: 'rb', inputValue: '1' },
                        { boxLabel: 'Item 2', name: 'rb', inputValue: '2', checked: true},
                        { boxLabel: 'Item 3asdfasdfsd', name: 'rb', inputValue: '3', style:'margin:auto;'}
                    ]
                }]
    }, baseConfig)
);

Ext.define('cocktaillayout', Ext.apply({
        itemId: 'cocktaillayout',
        html: '<img class="img-roomlayout" src="app/images/cocktail.png">' +
                '<div class="layoutName">Cocktail</div>'
    }, baseConfig)
);

Ext.define('theaterlayout', Ext.apply({
        itemId: 'theaterlayout',
        html: '<img class="img-roomlayout" src="app/images/theater.png">' +
                '<div class="layoutName">Theater</div>'
    }, baseConfig)
);

Ext.define('classroomlayout', Ext.apply({
        itemId: 'classroomlayout',
        html: '<img class="img-roomlayout" src="app/images/classroom.png">' +
                '<div class="layoutName">Classroom</div>',
        extenderItems : []
    }, baseConfig)
);

Ext.define('boardroomlayout', Ext.apply({
        itemId: 'boardroomlayout',
        html: '<img class="img-roomlayout" src="app/images/boardroom.png">' +
                '<div class="layoutName">Boardroom</div>'
    }, baseConfig)
);