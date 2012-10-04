//2677739417d - Machine Controls Project OID
var globalContext = {
	project: '/project/9001834352',
	projectScopeUp: false,
	projectScopeDown: true
}

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

	_onEpicSelected: function(combo) {
		this.swimLanes.removeAll();

		var mmfs = combo.getRecord().get('Children');

		if(mmfs.length === 0) {
			//ToDo: Display "has no MMFs message"
			return;
		}

		var me = this;
		this._getAllFeatures(mmfs, function(features) { 
			me._getAllThemesFromFeatures(features, function(uniqueThemes) {
				me._buildSwimLanesFor(mmfs, features, uniqueThemes);
			});
		}); 
	},
     
	_buildSwimLanesFor: function(mmfs, features, themes) {
		var featureMap = this._toLookup(features, function(feature) {
			return feature.get('Parent')._ref;
		});

		Ext.Array.each(mmfs, function(mmf) {
			this._buildSwimLaneFor(mmf, featureMap[mmf._ref], themes);
		}, this);
	},

	_toLookup: function(array, keyExtractor) {
		var lookup = {};

		Ext.Array.each(array, function(item) {
			var key = keyExtractor(item).toString();
			if(!lookup[key]) {
				lookup[key] = [];
			}
			lookup[key].push(item);
		});

		return lookup;
	},

	_getAllThemesFromFeatures: function(features, callback) {
		var uniqueThemes = Ext.Array.unique(
			Ext.Array.map(features, function(feature) { return feature.get('Theme'); })
		);

		callback(uniqueThemes);
	},

	_getAllFeatures: function(mmfs, callback) {
		Ext.create('Rally.data.WsapiDataStore', {
			autoLoad: true,
			fetch: true,
			model: 'portfolioitem/feature',
			context: globalContext,
			listeners: {
				load: function(store, records) { 
					callback(records); 
				}
			}
		});
	},

	_buildSwimLaneFor: function(mmf, features, themes) {
		var swimLanePanel = Ext.create('Ext.panel.Panel', {
			title: mmf._refObjectName
		});

		console.log(mmf);
		console.log(features);
		console.log(themes);

		this.swimLanes.add(swimLanePanel);
	},

	_createCardboard: function(store, records) {
		console.log(records);
	},

    launch: function() {
        this.add({
	        xtype: 'rallycombobox',
	        fieldLabel: 'Pick Parent Epix:',
	        labelCls: 'epic-label',
	        labelWidth: '175px',
	        grow: true,
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

    	this.swimLanes = this.add({
    		xtype:'container',
    		componentCls: 'swim-lanes-container'
    	});
    }
});
