AUI.add(
    'rivet-collaboration-spreadsheet',
    function(A) {
        
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

        var RivetCollaborationSpreadSheet = A.Component.create(
            {
                ATTRS: {
                    onlineUsers: {
                        value: []
                    }
                },
                
                CSS_PREFIX: 'table',

                EXTENDS: Liferay.RivetSpreadSheet,
                
                NAME: A.DataTable.Base.NAME,
                
                usersOnlineNode: null,

                prototype: {
                    ws: null,

                    initializer: function() {
                        this.bindCollaborativeEvents();
                        this.usersOnlineNode = this.get('srcNode').ancestor('.realtime-spreadsheet').one('.collaboration-users');
                    },
                    
                    bindCollaborativeEvents: function() {
                        this.bindAtmosphere();
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
                        this.ws.push(A.JSON.stringify({
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

                        this.ws.push(A.JSON.stringify(data));
                    },

                    /**
                    * Initializes and binds atmosphere events
                    *
                    *
                    */
                    bindAtmosphere: function() {
                        var instance = this;
                        
                        var sheet = A.one('#record_set_id');
                        var sheetId = null;
                        if(sheet){
                        	sheetId = sheet.get('value');
                        }
                        
                        var baseUrl = document.location.toString().split('/').slice(0, 3).join('/'); // gets only protocol, domain and port from current url
                        var request = {
                            url: baseUrl + '/delegate/collaborative-spreadsheet/'+sheetId+'?baseImagePath=' +
                                encodeURIComponent(Liferay.ThemeDisplay.getPathImage())+'&sheetId='+sheetId,
                            trackMessageLength: true,
                            transport: 'websocket'
                        };

                        request.onMessage = function (response) {
                            instance.processMessage(response);
                        };

                        request.onOpen = function (response) {
                            instance.ws.push(A.JSON.stringify({
                                action:  RivetCollaborationSpreadSheet.CONSTANTS.LOGIN
                            }));
                        };
                        
                        request.onClose = function (response) {};

                        atmosphere.util.on(window, "beforeunload", function (event) {
                            atmosphere.unsubscribe();
                        });

                        instance.ws = atmosphere.subscribe(request);
                    },
                    
                    /**
                    * Each time message arrives from messaging server, dispatches 
                    * the message by give action type
                    *
                    */
                    processMessage: function(response) {
                        var instance = this;
                        var data = A.JSON.parse(response.responseBody);
                        if (!data.commands) {
                            return;
                        }
                        A.Array.each(data.commands, function(item, index) {
                            switch(item.action) {
                                case RivetCollaborationSpreadSheet.CONSTANTS.USERS:
                                    instance.onUsersMessage(item.users);
                                    if (item.unloggedUser) {
                                        instance.onUserUnloggedMessage(item.unloggedUser);
                                    }
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
                    * Removes any  table user mark or highlight after any user goes away
                    * called when message arrives
                    */
                    onUserUnloggedMessage: function(user) {
                        this.clearHighlightByCellRef('usercell-' + user.userId);
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
                        this.ws.push(A.JSON.stringify({
                            action: RivetCollaborationSpreadSheet.CONSTANTS.ROWS_ADDED,
                            num: num,
                            userId: Liferay.ThemeDisplay.getUserId()
                        }));
                    }
                }
            });

            RivetCollaborationSpreadSheet.CONSTANTS = {
                LOGIN: 'login',
                CELL_HIGHLIGHTED: 'cellHighlighted', // when users highlight cell,
                CELL_VALUE_UPDATED: 'cellValueUpdated', // when users are changing cell value
                ROWS_ADDED: 'rowsAdded', // when users are changing cell value
                USERS: 'users'
            };

            Liferay.RivetCollaborationSpreadSheet = RivetCollaborationSpreadSheet;
        },
    	'',
    	{
    		requires: ['rivet-inline-cell', 'rivet-spreadsheet-datatable', 'rivet-users-color', 'atmosphere', 'aui-arraysort', 'aui-datatable', 'datatable-sort', 'json', 'liferay-portlet-url', 'liferay-util-window', 'handlebars']
    	})
