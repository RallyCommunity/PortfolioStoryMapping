//2677739417d - Machine Controls Project OID
var globalContext = {
	project: '/project/2677739417',
	projectScopeUp: false,
	projectScopeDown: true
}

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

	_onEpicSelected: function(combo) {
		console.log('selected...')

		Ext.Array.each(combo.getRecord().get('Children'), function(child) {
			this._buildSwimLaneFor(child);
		}, this);
	},

	_buildSwimLaneFor: function(child) {
		console.log('adding swim lane for ' + child._ref);
		var itemConfig = {
			xtype: 'panel',
			title: child._refObjectName
		};

		this.add(itemConfig);
	},

    launch: function() {
        this.add({
	        xtype: 'rallycombobox',
	        fieldLabel: 'Epix',
	        autoSelect: true,
	        storeConfig: {
	        	autoLoad: true,
	            model: 'portfolioitem/epic',
	            context: globalContext
	        },
	        listeners: {
				select: this._onEpicSelected,
				ready: this._onEpicSelected,
	        	scope: this
	        },	
	    });
    }
});
