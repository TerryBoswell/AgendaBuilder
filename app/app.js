(function () {
    Ext.onReady(function() {

            createAgendaBuilder = function(target, rfpNumber, numberOfPeople){
                var mainCtr = Ext.create('AgendaBuilder.MainContainer', {
                    renderTo: target,
                    rfpNumber: rfpNumber,
                    numberOfPeople: numberOfPeople,
                   //apiUrl: 'https://etouches987.zentilaqa.com',
                    agendaMode: agendaMode.Planner
                });
                return {
                    pushBackFocus : mainCtr.pushBackFocus,
                    refresh: mainCtr.refresh, 
                    addPreDays : mainCtr.addPreDays,
                    addPostDays: mainCtr.addPostDays
                };
            }
            
            
        });
})();





