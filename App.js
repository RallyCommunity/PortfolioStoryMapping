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

    	this.right = Ext.create('Ext.container.Container', {
	    	componentCls: 'inner'
		});

		this.add(this._wrapInContainer(this.left, 'lefty'));
		this.add(this._wrapInContainer(this.right, 'righty'));

		this._showDefaultMessage();

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
		var board =  Ext.create('Rally.ui.cardboard.CardBoard', {
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
						deselect: function(card) {
							card.removeCls('card-selected');
						},
						select: function(card)  {
							card.addCls('card-selected');
							onSelect(card);
						}
					}
				},
				storeConfig: {
					fetch: ['Children'],
					context: globalContext
				}
	    	});
		return board;
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

		var mmfs = this._getSortedMmfs(epicCard.getRecord().get('Children'));
		if(mmfs.length === 0) {
			//ToDo: Display "has no MMFs message"
			return;
		}

		var me = this;
		this._getAllFeatures(mmfs, function(features) {
			var filteredFeatures = me._getFeaturesInsideEpicScope(mmfs, features);

			me._getUniqueAttributeValues(filteredFeatures, 'Theme', function(uniqueThemes) {
				var sortedThemes = Ext.Array.sort(uniqueThemes);
				me._addAddNewFeature(mmfs[0]);
				me._buildCardBoardHeader(sortedThemes);
				me._buildSwimLanesFor(mmfs, sortedThemes);
			});
		}); 
	},

	_getSortedMmfs: function(mmfs) {
		return Ext.Array.sort(mmfs, function(left, right) {
			return left.Rank > right.Rank;
		})
	},

	_getFeaturesInsideEpicScope: function(mmfs, features) {
		var mmfRefs = Ext.Array.pluck(mmfs, '_ref');
		return Ext.Array.filter(features, function(feature) {
			return Ext.Array.contains(mmfRefs, feature.get('Parent')._ref);
		});
	},

	_addAddNewFeature: function(parent) {
		this.right.add(
			Ext.create('Rally.ui.AddNew', {
		        recordTypes: ['portfolioitem/feature'],
		        ignoredRequiredFields: ['Creation Date', 'Name', 'FormattedID', 'PortfolioItemType', 'Project'],
		        newButtonText: 'Add New Feature',
		        fieldLabel: 'New Feature',		
		        showAddWithDetails: false,     
		        listeners: {
		        	beforecreate: function(component, record, operation, options) {

		        		record.set('Parent', parent);
		        		record.set('Project', globalContext ? globalContext.project : this.getContext().getProject());
		        		record.set('Theme', '');
		        	},
		            create: function(component, record, operation, options) {		
		            	Ext.create('Rally.data.WsapiDataStore', {
		            		context: globalContext,
		            		autoLoad: true,
		            		model: 'portfolioitem/feature',
		            		fetch: true,
		            		filters: [{
		            			property: 'ObjectID',
		            			value: record.get('ObjectID')
		            		}],
		            		listeners: {
		            			load: function(store, records) {
					            	Rally.environment.getMessageBus().publish(Rally.Message.objectCreate, records[0]);
		            			}
		            		}
		            	});
	            	},
	            	scope:this
	            }
			})
		);
	},
     
	_buildSwimLanesFor: function(mmfs, themes) {
		Ext.Array.each(mmfs, function(mmf) {
			this._buildSwimLaneFor(mmf, themes);
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
			fetch: ['Theme', 'Parent'],
			model: 'portfolioitem/feature',
			context: globalContext,
			listeners: {
				load: function(store, records) { 
					callback(records); 
				}
			}
		});
	},

	_buildCardBoardHeader: function(themes) {
		var cardboard = Ext.create('Rally.ui.cardboard.CardBoard', {			
			componentCls: 'swimlane-board hide-columns',
			attribute: 'Theme',
			columns: this._createColumns(themes, false),
			cardConfig: {
				editable: true,
				showHeaderMenu: true
			},
		});		

		this.right.add(cardboard);
	},

	_buildSwimLaneFor: function(mmf, themes) {
		var swimLanePanel = Ext.create('Ext.panel.Panel', {
			title: '<a href="' + mmf._ref + '">' + mmf.FormattedID + ' - ' + mmf._refObjectName + '</a>',
			componentCls: 'swim-lane-panel',
			border: false
		});

		var container = Ext.create('Ext.container.Container', {
			border: true
		});

		var cardboard = Ext.create('Rally.ui.cardboard.CardBoard', {			
			componentCls: 'swimlane-board hide-header',
			types: ['portfolioitem/feature'],
			attribute: 'Theme',
			columns: this._createColumns(themes, true),
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

		container.add(cardboard);
		swimLanePanel.add(container);
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
	},

	_showDefaultMessage: function() {
		this.right.add(
			Ext.create('Ext.draw.Text', {
				componentCls: 'help-text',
            	text: 'Please select an epic.'
	    	})
		);
	}	
});
