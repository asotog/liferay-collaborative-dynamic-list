AUI.add(
    'rivet-collaboration-spreadsheet',
    function(A) {
    	var Lang = A.Lang;
    	var INVALID = A.Attribute.INVALID_VALUE;
    	var isArray = Lang.isArray;
    	
    	var modelClientId = 0;
    	
        /**
        * Generates handlebars template from give template script tags by id
        *
        *
        */
        var getTemplate = function(id) {
            var templateString = A.one(id).get('innerHTML');
            return A.Handlebars.compile(templateString);
        };

        var TEMPLATES = {
            usersOnline: getTemplate('#spreadsheet-online-users')
        };
        
        /**
         * Custom model so client id can be reset before navigating to this page via SPA,
         * so model id are sync between browsers, this model is only used on this component so does not affect anything else
         */
        var RivetSpreadSheetModel = A.Component.create({
        	NAME: A.Model.NAME,
        	EXTENDS: A.Model,
        	prototype: {
        		generateClientId: function () {
        			modelClientId || (modelClientId = 0);
        	        return this.constructor.NAME + '_' + (modelClientId += 1);
        	    }
        	}
        });
        
        /**
         * Real Time Collaboration Spreadsheet component
         */
        var RivetCollaborationSpreadSheet = A.Component.create(
            {
                ATTRS: {
                    onlineUsers: {
                        value: []
                    },
                    websocketAddress: {
                    	value: ''
                    }
                },
                
                CSS_PREFIX: 'table',

                EXTENDS: Liferay.RivetSpreadSheet,
                
                NAME: A.DataTable.Base.NAME,
                
                usersOnlineNode: null,
                
                prototype: {
                    ws: null,
                    
                    supported: true, // flag set after verification is current browser is supported by communication protocol
                    
                    initializer: function() {
                        this.bindCollaborativeEvents();
                        this.usersOnlineNode = this.get('srcNode').ancestor('.realtime-spreadsheet').one('.collaboration-users');
                    },
                    
                    bindCollaborativeEvents: function() {
                        this.bindCommunication();
                        this.after('onlineUsersChange', A.bind(this._renderOnlineUsers, this));
                        this.on('cellHighlighted', A.bind(this._currentUserCellHighlighted, this));
                        this.on('cellValueUpdated', A.bind(this._currentUserCellValueUpdated, this));
                    },
                    
                    /**
                    * Processes users when they get online or offline
                    *
                    *
                    */
                    _renderOnlineUsers: function(e) {
                        this.usersOnlineNode.empty();
                        this.usersOnlineNode.append(TEMPLATES.usersOnline({users: this.get('onlineUsers')}));
                    },
                    
                    /**
                    * Triggers message with the cell information that current user is highlighting
                    *
                    *
                    */
                    _currentUserCellHighlighted: function(e) {
                        this.ws.send(A.JSON.stringify({
                            action:  RivetCollaborationSpreadSheet.CONSTANTS.CELL_HIGHLIGHTED,
                            userId: Liferay.ThemeDisplay.getUserId(),
                            record: e.record,
                            column: e.col    
                        }));
                    },
                    
                    /**
                    * Triggers message with the cell value that current user is updating
                    *
                    *
                    */
                    _currentUserCellValueUpdated: function(e) {
                        var data = {
                            action:  RivetCollaborationSpreadSheet.CONSTANTS.CELL_VALUE_UPDATED,
                            userId: Liferay.ThemeDisplay.getUserId(),
                            value: e.value,
                            rawValue: e.rawValue,
                            record: e.record,
                            column: e.col    
                        };

                        this.ws.send(A.JSON.stringify(data));
                    },

                    /**
                    * Initializes and binds communication events
                    *
                    *
                    */
                    bindCommunication: function() {
                        var instance = this;
                        if (!window.WebSocket) { // if websocket not supported from current browser
                            instance.supported = false;
                            return;
                        };
                        
                        var websocketAddress = instance.get('websocketAddress');
                        var sheetId = this.get('srcNode').getAttribute('id'); // use portlet instance id for sheet id value
                        websocketAddress += '&sheetId=' + sheetId;

                        instance.ws = new WebSocket(websocketAddress);
                        instance.ws.onopen = function (evt) {
                        	instance.ws.send(A.JSON.stringify({
                        		action:  RivetCollaborationSpreadSheet.CONSTANTS.LOGIN
                        	}));
                        };
                        instance.ws.onclose = function (evt) {
                            instance.fire('connectionClosed');
                        };
                        instance.ws.onmessage = function (event) {
                        	instance.processMessage(event.data);
                        };
                        instance.ws.onerror = function (evt) {
                            console.error(evt);
                        };
                        // when SPA (single page app) navigation is configured
                        // need to listen beforeNavigate event to manually close connection
                        Liferay.on('beforeNavigate', function (event) {
                        	instance.ws.close();
                        });
                    },
                    
                    /**
                    * Each time message arrives from messaging server, dispatches 
                    * the message by give action type
                    *
                    */
                    processMessage: function(response) {
                        var instance = this;
                        var data = A.JSON.parse(response);
                        if (!data.commands) {
                            return;
                        }
                        A.Array.each(data.commands, function(item, index) {
                            switch(item.action) {
                                case RivetCollaborationSpreadSheet.CONSTANTS.USERS:
                                    instance.onUsersMessage(item.users);
                                    instance.get('boundingBox').all('.cell-highlight:not(.current-user)').each(function(cell) {
                                        const isUserLogged = item.users.some(({ userId }) => cell.hasClass(`usercell-${userId}`));
                                        if (!isUserLogged) {
                                            instance.clearHighlightByCellRef(cell.getAttribute('ref-class'));
                                        }
                                    });
                                    break;
                                case RivetCollaborationSpreadSheet.CONSTANTS.CELL_HIGHLIGHTED:
                                    instance.onCellHighlightMessage(item);
                                    break;
                                case RivetCollaborationSpreadSheet.CONSTANTS.CELL_VALUE_UPDATED:
                                    instance.onCellValueUpdateMessage(item);
                                    break;
                                case RivetCollaborationSpreadSheet.CONSTANTS.ROWS_ADDED:
                                    instance.onRowsAddedMessage(item);
                                    break;
                                case RivetCollaborationSpreadSheet.CONSTANTS.LAST_ROW_DELETED:
                                    instance.onLastRowDeletedMessage(item);
                                    break;
                                default:
                                    console.error('Unable to match command');
                            };
                        });
                    },

                    /*
                    * Assigns colors to users and verifies if they are already viewing document
                    * because message returns all the users everytime another user joins,
                    * called when message arrives
                    */
                    onUsersMessage: function(users) {
                        var instance = this;
                        var onlineUsersTmp = [];
                        A.Array.each(users, function(item, index) {
                            item.color = A.UsersColors.pickColor(item.userId);
                            // update highlight color for current user
                            if (item.userId === Liferay.ThemeDisplay.getUserId()) {
                                instance.set('highlightColor', item.color);
                            };
                            item.userName = (item.userName === 'rivetlogic.spreadsheet.guest.name.label') ? 'Guest' : item.userName;
                            onlineUsersTmp.push(item);
                        });
                        this.set('onlineUsers', onlineUsersTmp);
                    },
                    
                    /*
                    * Highlight cells that belongs to other users interactions,
                    * called when message arrives
                    *
                    */
                    onCellHighlightMessage: function(data) {
                        var instance = this;
                        if (Liferay.ThemeDisplay.getUserId() === data.userId) {
                            return;
                        }
                        var cell = instance.getCellFromRecord(data);
                        var user = instance.getUserFromOnlineList(data.userId);
                        instance._updateTitledHighlightCellByClasses({
                            title: user.userName,
                            refClass: 'usercell-' + data.userId,
                            cell: cell,
                            color: A.UsersColors.pickColor(data.userId)
                        });
                    },
                    
                    /*
                    * Called when rows added message arrives
                    */
                    onRowsAddedMessage: function(data) {
                        var instance = this;
                        if (Liferay.ThemeDisplay.getUserId() !== data.userId) {
                            this.addEmptyRows(data.num);
                        }
                    },

                    /*
                    * Called when last row deleted message arrives
                    */
                    onLastRowDeletedMessage: function(data) {
                        var instance = this;
                        if (Liferay.ThemeDisplay.getUserId() !== data.userId) {
                            var currentSize = instance.get('data').size();
                            instance.get('data').remove(currentSize - 1);
                        }
                    },

                    /*
                    * Highlight cells that belongs to other users interactions
                    * and updates cells value, called when message arrives
                    * 
                    *
                    */
                    onCellValueUpdateMessage: function(data) {
                        if (Liferay.ThemeDisplay.getUserId() === data.userId) {
                            return;
                        }
                        var cell = this.getCellFromRecord(data);
                        Liferay.RivetInlineCellEditor.setCellValue(cell, data.value);
                        this.onCellHighlightMessage(data);
                        // with raw value, the model is updated
                        var column = this.getColumn(cell);
                        var record = this.getRecord(cell);
                        // set the local model and avoid fire event, to prevent
                        // looping to the same event listeners
                        record.set(column.key, data.rawValue, {silent: true});
                    },
                     
                    /*
                    * Retrieves cell node from give col and record
                    * 
                    *
                    */
                    getCellFromRecord: function(data) {
                        var cellSelector = '[data-yui3-record="' + data.record + '"] .' + data.column;
                        return this.get('boundingBox').one(cellSelector);
                    },
                    
                    /*
                    * Gets user by id from the users list stored,
                    * user item contains basic info such as userName,  
                    * userId, color, userImagePath
                    */
                    getUserFromOnlineList: function(userId) {
                        for (var i = 0; i < this.get('onlineUsers').length; i++) {
                            if (this.get('onlineUsers')[i].userId === userId) {
                                return this.get('onlineUsers')[i];
                            }
                        }
                    },
                    
                    /*
                    * Once user adds more rows, this sends message to the 
                    * other users in order to add the rows as well
                    */
                    addEmptyRowsAndBroadcast: function(num) {
                        this.ws.send(A.JSON.stringify({
                            action: RivetCollaborationSpreadSheet.CONSTANTS.ROWS_ADDED,
                            num: num,
                            userId: Liferay.ThemeDisplay.getUserId()
                        }));
                    },

                    /**
                     * Removes the last row from the sheet
                     */
                    removeLastRowAndBroadcast: function() {
                        this.ws.send(A.JSON.stringify({
                            action: RivetCollaborationSpreadSheet.CONSTANTS.LAST_ROW_DELETED,
                            userId: Liferay.ThemeDisplay.getUserId()
                        }));
                    },
                    
                    /**
                     * @override from datatable-core module
                     * so we can specify a custom model instead of default Y.Model
                     */
                    _setData: function (val) {
                        if (val === null) {
                            val = [];
                        }

                        if (isArray(val)) {
                            this._initDataProperty();
                            
                            this.data.model = RivetSpreadSheetModel; // specify custom model
                            
                            // silent to prevent subscribers to both reset and dataChange
                            // from reacting to the change twice.
                            // TODO: would it be better to return INVALID to silence the
                            // dataChange event, or even allow both events?
                            this.data.reset(val, { silent: true });

                            // Return the instance ModelList to avoid storing unprocessed
                            // data in the state and their vivified Model representations in
                            // the instance's data property.  Decreases memory consumption.
                            val = this.data;
                        } else if (!val || !val.each || !val.toJSON) {
                            // ModelList/ArrayList duck typing
                            val = INVALID;
                        }

                        return val;
                    }
                }
            });

            RivetCollaborationSpreadSheet.CONSTANTS = {
                LOGIN: 'login',
                CELL_HIGHLIGHTED: 'cellHighlighted', // when users highlight cell,
                CELL_VALUE_UPDATED: 'cellValueUpdated', // when users are changing cell value
                ROWS_ADDED: 'rowsAdded', // when users are changing cell value
                LAST_ROW_DELETED: 'lastRowDeleted',
                USERS: 'users'
            };
            
            RivetCollaborationSpreadSheet.resetClientIdFromModel = function() {
            	modelClientId = 0;
            };
            
            Liferay.RivetCollaborationSpreadSheet = RivetCollaborationSpreadSheet;
        },
    	'',
    	{
    		requires: ['rivet-inline-cell', 'rivet-spreadsheet-datatable', 'rivet-users-color', 'aui-arraysort', 'aui-datatable', 'datatable-sort', 'json', 'liferay-portlet-url', 'liferay-util-window', 'handlebars']
    	})
