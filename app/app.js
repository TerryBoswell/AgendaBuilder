(function () {
    Ext.onReady(function() {
            Ext.create('AgendaBuilder.MainContainer', {
                 renderTo: Ext.getBody()
            });
        });

    window.agendaBuilder = {};
})();