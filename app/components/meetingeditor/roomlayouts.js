var baseConfig = {
    extend  : 'Ext.Container',
    cls     : 'roomLayout',
    height  : 80,
    width   : 80,
    listeners: {
        scope: this,
        render  : function(cmp, eOpts){
            var observer = this.observer;
            cmp.mon(cmp.el, 'mouseover', function(e){
                cmp.el.dom.classList.add('roomLayoutSelect');
            })
            cmp.mon(cmp.el, 'mouseout', function(e){
                cmp.el.dom.classList.remove('roomLayoutSelect');
            })
        }
    }
};

Ext.define('squarelayout', Ext.apply({
        html: '<div class="layoutName">Square</div>'
    }, baseConfig)
);

Ext.define('ushapelayout', Ext.apply({
        html: '<div class="layoutName">U Shape</div>'
    }, baseConfig)
);

Ext.define('roundlayout', Ext.apply({
        html: '<div class="layoutName">Rounds</div>'
    }, baseConfig)
);

Ext.define('cocktaillayout', Ext.apply({
        html: '<div class="layoutName">Cocktail</div>'
    }, baseConfig)
);

Ext.define('theaterlayout', Ext.apply({
        html: '<div class="layoutName">Theater</div>'
    }, baseConfig)
);

Ext.define('classroomlayout', Ext.apply({
        html: '<div class="layoutName">Classroom</div>'
    }, baseConfig)
);

Ext.define('boardroomlayout', Ext.apply({
        html: '<div class="layoutName">Boardroom</div>'
    }, baseConfig)
);