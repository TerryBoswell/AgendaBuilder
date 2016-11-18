(function () {
    Ext.onReady(function() {
            var mainCtr = Ext.create('AgendaBuilder.MainContainer', {
                 renderTo: Ext.getBody(),
                 rfpNumber: '11055'
            });

            Ext.create('Ext.Button',{
                text: 'Add One Day Before',
                renderTo: Ext.getBody(),
                scope: this,
                handler: function(){
                    mainCtr.addPreDays(1);
                }
            })

            Ext.create('Ext.Button',{
                text: 'Add One Day After',
                renderTo: Ext.getBody(),
                scope: this,
                handler: function(){
                    mainCtr.addPostDays(1);
                }
            })

        });
})();





