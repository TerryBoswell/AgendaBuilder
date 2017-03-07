(function () {
    Ext.onReady(function() {

            // rfpNumber: '12676',
                    //rfpNumber: '12532',
                    //rfpNumber: '10807',
                    //rfpNumber: '12036',
                    //12036


            new Ext.util.DelayedTask(function(){
                window.ab = createAgendaBuilder(Ext.getBody(), '12745');
            }).delay(100);      
            
            
            // Ext.create('Ext.Button',{
            //     text: 'Add One Day Before',
            //     renderTo: Ext.getBody(),
            //     scope: this,
            //     handler: function(){
            //         mainCtr.addPreDays(1);
            //     }
            // })

            // Ext.create('Ext.Button',{
            //     text: 'Add One Day After',
            //     renderTo: Ext.getBody(),
            //     scope: this,
            //     handler: function(){
            //         mainCtr.addPostDays(1);
            //     }
            // })

            // Ext.create('Ext.Button',{
            //     text: '<div style="background-color:white; color:blue;">Planner</div>',
            //     renderTo: Ext.getBody(),
            //     scope: this,
            //     width: 200,
            //     handler: function(me){
            //         if (mainCtr.agendaMode == agendaMode.Planner)
            //         {
            //             me.setText('<div style="background-color:blue; color:white;">Hotel</div>');
            //             mainCtr.setAgendaMode(agendaMode.Hotel);
            //         }
            //         else
            //         {
            //             me.setText('<div style="background-color:white; color:blue;">Planner</div>');
            //             mainCtr.setAgendaMode(agendaMode.Planner);
            //         }
            //     }
            // })
        });
})();





