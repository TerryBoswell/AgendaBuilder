(function () {
    Ext.onReady(function() {

            createAgendaBuilder = function(target, rfpNumber){
                var mainCtr = Ext.create('AgendaBuilder.MainContainer', {
                    renderTo: target,
                    rfpNumber: rfpNumber,
                   //apiUrl: 'https://etouches987.zentilaqa.com',
                    agendaMode: agendaMode.Planner
                });
                return {
                    pushBackFocus : mainCtr.pushBackFocus,
                    refresh: mainCtr.refresh
                };
            }
            
            
        });
})();





