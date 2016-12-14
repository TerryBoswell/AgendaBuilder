Ext.ns('AgendaBuilder');

Ext.define('AjaxController', {
    extend: 'Ext.mixin.Observable',
    $applyConfigs: true,
    rfpNumber: null,
    ajaxUrlBase: null,
    getUrl: function(callUrl){
        if (!this.ajaxUrlBase)
            throw("ajax Url Base must be set");
        if (!this.rfpNumber)
            throw("rpf number must be set");
        if (!callUrl)
            throw("call url must be passed")
        return this.ajaxUrlBase.concat(callUrl, this.rfpNumber, "/json/");
    },   
    getPostUrl: function(callUrl){
        if (!this.ajaxUrlBase)
            throw("ajax Url Base must be set");
        if (!this.rfpNumber)
            throw("rpf number must be set");
        if (!callUrl)
            throw("call url must be passed")
        return this.ajaxUrlBase.concat(callUrl);
    },   
    doGet: function(url, callback, scope){      
        var me = scope;   
        Ext.Ajax.request({
            url: this.getUrl(url),
            method: 'GET',
            scope: me,
            success: function(response, opts) {
                var obj = Ext.decode(response.responseText);
                callback(obj, opts.scope);
            },

            failure: function(response, opts) {
                console.log('server-side failure with status code ' + response.status);
            }
        });
    },
    doPost: function(url, callback, data, scope){
        var me = scope;
        new Ext.util.DelayedTask(function(){
            var fakeResponse = {id: Ext.Number.randomInt(99999,999999), success: true};
            if (data.id)
                fakeResponse.id = data.id;
            console.info('A mocked post has occurred', data, fakeResponse);
            callback(data, fakeResponse, me);
        }, me).delay(100);   
        // Ext.Ajax.request({
        //     url: this.getPostUrl(url),
        //     method: 'POST',
        //     scope: me,
        //     jsonData: data,
        //     headers: { 'Content-Type': 'application/json' },
        //     success: function(response, opts) {
        //         var obj = Ext.decode(response.responseText);
        //         Ext.apply(data, obj);
        //         callback(data, opts.scope);
        //     },

        //     failure: function(response, opts) {
        //         console.log('server-side failure with status code ' + response.status);
        //     }
        // });
    },
    getRoomSetups: function(callback, scope){
        this.doGet("/planners/rfp/meeting_room_setups/", callback, scope);
    },
    getMeetingItemTypes: function(callback, scope){
        this.doGet("/planners/rfp/meeting_item_types/", callback, scope);
    },
    getMeetingItems: function(callback, scope){
        this.doGet("/planners/rfp/meeting_items/", callback, scope);
    },
    saveMeetingItem: function(meeting, callback, scope){
        var me = this;
        var url = Ext.String.format('/planners/rfp/meeting_item_save/{0}/json/', me.rfpNumber, scope);
        me.doPost(url, callback, meeting, scope);
    },
    deleteMeetingItem: function(id, callback, scope){
        var me = this;
        var url = Ext.String.format('/planners/rfp/meeting_item_delete/{0}}/json/', me.rfpNumber, scope);
        new Ext.util.DelayedTask(function(){
            var fakeResponse = {id: id, success: true};
            console.info('A mocked delete has occurred', id, fakeResponse);
            callback(id, scope);
        }, me).delay(100);   
    },
    saveAlternateOption: function(){},
    savePrePostDays: function(type, count, callback, scope){
        var me = this;
        var url = Ext.String.format('/planners/{0}/add_pre_post_days/', me.rfpNumber);
        me.doPost(url, callback, {type: type, count: count}, scope);
    }
        
});

