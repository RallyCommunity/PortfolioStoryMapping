//2677739417d - Machine Controls Project OID
var globalContext = {
	project: '/project/9001834352',
	projectScopeUp: false,
	projectScopeDown: true
}

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
    	this.left = Ext.create('Ext.container.Container', {
			componentCls: 'inner'
		});

    	this.right =  Ext.create('Ext.container.Container', {
	    	componentCls: 'inner'
		});

		this.add(this._wrapInContainer(this.left, 'lefty'));
		this.add(this._wrapInContainer(this.right, 'righty'));

    	var me = this;
    	this._loadEpicTypeDefinition(function(epicTypeDef) {
	    	me.left.add(
	    		me._createEpicPickList(epicTypeDef, Ext.bind(me._onEpicSelected, me))
			);		
    	});
    },

	_loadEpicTypeDefinition: function(callback) {
    	var typeDefinitionStore = Ext.create('Rally.data.WsapiDataStore', {
    		model: 'TypeDefinition',
    		context: globalContext,
    		autoLoad: true,
    		filters: [
    			{
    				property: 'TypePath',
    				value: 'PortfolioItem/Epic'
    			}
    		],
    		listeners: {
    			load: function(store, records) {
    				callback(records[0]);
    			}
    		}
    	});
	},

	_createEpicPickList: function(epicTypeDef, onSelect) {
		return Ext.create('Rally.ui.cardboard.CardBoard', {
	    		types: ['portfolioitem/epic'],
	    		attribute: ['PortfolioItemType'],
				cardConfig: {
					editable: true,
					showHeaderMenu: true
				},
				columns: [
					{
						displayValue: 'Epics',
						value: epicTypeDef.get('_ref'),				
						storeConfig: {
							autoLoad: true,
							model: 'portfolioitem/epic',
							context: globalContext
						}
					}
				],
				cardConfig: {
					listeners: {
						select: onSelect
					}
				},
				storeConfig: {
					fetch: ['Children'],
					context: globalContext
				}
	    	});
	},

	_wrapInContainer: function(component, cls) {
		var wrapper = Ext.create('Ext.container.Container', {
    		componentCls: cls
    	});

    	wrapper.add(component);

    	return wrapper;
	},

	_getUniqueAttributeValues: function(objects, attribute, callback){
		var uniqueValues = Ext.Array.unique(
			Ext.Array.map(objects, function(objects) { return objects.get(attribute); })
		);

		callback(Ext.Array.remove(uniqueValues, ''));
	},

	_onEpicSelected: function(epicCard) {
		this.right.removeAll();

		var mmfs = epicCard.getRecord().get('Children');

		if(mmfs.length === 0) {
			//ToDo: Display "has no MMFs message"
			return;
		}

		var me = this;
		this._getAllFeatures(mmfs, function(features) {
			me._getUniqueAttributeValues(features, 'Theme', function(uniqueThemes) {
				me._buildSwimLanesFor(mmfs, uniqueThemes);
			});
		}); 
	},
     
	_buildSwimLanesFor: function(mmfs, themes) {
		var showHeaders = true;
		Ext.Array.each(mmfs, function(mmf) {
			this._buildSwimLaneFor(mmf, themes, showHeaders);
			showHeaders = false;
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

	_getAllFeatures: function(mmfs, callback) {
		Ext.create('Rally.data.WsapiDataStore', {
			autoLoad: true,
			fetch: ['Theme'],
			model: 'portfolioitem/feature',
			context: globalContext,
			listeners: {
				load: function(store, records) { 
					callback(records); 
				}
			}
		});
	},

	_buildSwimLaneFor: function(mmf, themes, showHeaders) {
		var swimLanePanel = Ext.create('Ext.panel.Panel', {
			title: mmf._refObjectName
		});

		var cardboard = Ext.create('Rally.ui.cardboard.CardBoard', {			
			componentCls: 'swimlane-board' + (showHeaders ? '' : ' hide-header'),
			types: ['portfolioitem/feature'],
			attribute: 'Theme',
			columns: this._createColumns(themes),
			cardConfig: {
				editable: true,
				showHeaderMenu: true
			},
			storeConfig: {
				autoLoad: true,
				context: globalContext,
				fetch: ['Parent'],
				filters: [
					{
						property: 'Parent',
						value: mmf._ref
					}
				]
			},
			listeners: {
				beforecarddroppedsave: function(targetColumn, card) {
					card.getRecord().set('Parent', mmf);
				}
			}
		});

		swimLanePanel.add(cardboard);
		this.right.add(swimLanePanel);
	},

	_createColumns: function(themes) {
		var noEntryColumn = {
			displayValue: 'No Entry',
			value: ''
		};

		var columns = Ext.Array.map(themes, function(theme) {
			return {
				displayValue: theme,
				value: theme
			};
		});

		return Ext.Array.union([noEntryColumn], columns);
	}
});
