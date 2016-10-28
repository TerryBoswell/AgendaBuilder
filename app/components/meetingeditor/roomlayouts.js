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
        html: 
            '<img class="img-roomlayout" src="app/images/boardroom.png">' +
            '<div class="layoutName img-banquet">Square</img></div>'
    }, baseConfig)
);

Ext.define('ushapelayout', Ext.apply({
        html: '<img class="img-roomlayout" src="app/images/u-shape.png" >' +
              '<div class="layoutName">U Shape</div>'
    }, baseConfig)
);

Ext.define('roundlayout', Ext.apply({
        html: '<img class="img-roomlayout" src="app/images/banquet.png">' +
                '<div class="layoutName">Rounds</div>'
    }, baseConfig)
);

Ext.define('cocktaillayout', Ext.apply({
        html: '<img class="img-roomlayout" src="app/images/cocktail.png">' +
                '<div class="layoutName">Cocktail</div>'
    }, baseConfig)
);

Ext.define('theaterlayout', Ext.apply({
        html: '<img class="img-roomlayout" src="app/images/theater.png">' +
                '<div class="layoutName">Theater</div>'
    }, baseConfig)
);

Ext.define('classroomlayout', Ext.apply({
        html: '<img class="img-roomlayout" src="app/images/classroom.png">' +
                '<div class="layoutName">Classroom</div>'
    }, baseConfig)
);

Ext.define('boardroomlayout', Ext.apply({
        html: '<img class="img-roomlayout" src="app/images/boardroom.png">' +
                '<div class="layoutName">Boardroom</div>'
    }, baseConfig)
);