(function () {
    Ext.onReady(function() {

            createAgendaBuilder = function(target, rfpNumber, numberOfPeople){
                var numPeople = parseInt(numberOfPeople);
                if (isNaN(numPeople))
                    throw("Invalid Number of People passed");
                var mainCtr = Ext.create('AgendaBuilder.MainContainer', {
                    renderTo: target,
                    rfpNumber: rfpNumber,
                    numberOfPeople: numPeople,
                   //apiUrl: 'https://etouches987.zentilaqa.com',
                    agendaMode: agendaMode.Planner
                });
                return {
                    pushBackFocus : mainCtr.pushBackFocus,
                    refresh: mainCtr.refresh, 
                    addPreDays : mainCtr.addPreDays,
                    addPostDays: mainCtr.addPostDays,
                    setNumberOfPeople: mainCtr.setNumberOfPeople
                };
            }
            
            
        });
})();





