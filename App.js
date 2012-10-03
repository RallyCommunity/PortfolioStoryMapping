//2677739417d - Machine Controls Project OID

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

	items: [
		
	],

	_onEpicSelected: function(combo) {
		var epicRef = combo.getRecord().get('_ref');

		
	},

    launch: function() {
        this.add({
	        xtype: 'rallycombobox',
	        fieldLabel: 'Epix',
	        autoSelect: true,
	        storeConfig: {
	        	autoLoad: true,
	            model: 'portfolioitem/epic',
	            context: {
	            	project: '/project/2677739417',
					projectScopeUp: false,
        			projectScopeDown: true
	            }
	        },
	        listeners: {
				select: this._onEpicSelected,
				ready: this._onEpicSelected,
	        	scope: this
	        },	
	    });
    }
});
