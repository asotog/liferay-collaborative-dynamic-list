AUI.add(
    'rivet-inline-cell',
    function(A) {
        
        var InlineCellEditor = A.Component.create({
            
            /**
            * Static property provides a string to identify the class.
            *
            * @property NAME
            * @type String
            * @static
            */
            NAME: 'inlineCellEditor',
            
            /**
            * Static property used to define which component it extends.
            *
            * @property EXTENDS
            * @type Object
            * @static
            */
            EXTENDS: A.Base,
            
            prototype: {
                ELEMENT_TEMPLATE: '<input type="text">', // avoids error, this value is expected by BaseCellEditor
                initializer: function(config) {
                    var instance = this;
                },
                
                /**
                * Edits the selected cell, called externally from the data table definition
                *
                *
                */
                editInlineCell: function(tableData) {
                    var tbl = tableData;
                    tbl.activeCell.removeClass('table-cell'); // class is removed and then added because of FF issue
                    tbl.activeCell.addClass('inline-cell-editor');
                    var val = Liferay.RivetInlineCellEditor.getCellValue(tbl.activeCell);
                    Liferay.RivetInlineCellEditor.setCellValue(tbl.activeCell, val);
                    if (!tbl.activeCell.one('input')) {
                        this.showInlineCellField(tbl);
                        this.bindInlineCell(tbl);
                    }
                },
                
                /**
                * Attaches events
                *
                *
                */
                bindInlineCell: function(tableData) {
                    var tbl = tableData;
                    var instance = this;
                    // ends editing cell
                    tbl.activeCell.one('input').on('blur', function() {
                        tbl.activeCell.addClass('table-cell'); // class is removed and then added because of FF issue
                        var val = this.get('value');
                        this.remove();
                        Liferay.RivetInlineCellEditor.setCellValue(tbl.activeCell, val);
                        try {
                            tbl.record.set(tbl.column.key, this.get('value')); // update model
                        } catch(e) {}
                    });
                    // editing cell value
                    tbl.activeCell.one('input').on('keyup', function(e) {
                        e.stopPropagation();
                        if (this.get('value') !== instance.get('value')) {
                            instance.set('value', this.get('value'));
                            var data = tbl.table.getCellData(tbl.activeCell);
                            data.value = this.get('value');
                            data.rawValue = this.get('value');
                            tbl.table.fire('cellValueUpdated', data);
                        }
                    });
                    
                    // datatable enables the user switch cells with arrows so lets avoid 
                    // while its on inline cell editing
                    var stopCellSelection = function() {
                        tbl.activeCell.one('input').once('key', function(e) {
                            e.stopPropagation();
                            stopCellSelection();
                        }, 'down:enter,37,38,39,40');
                    };
                    stopCellSelection();
                },
                
                /**
                * Shows cell edit field, it focus field and 
                * user can type inside
                *
                */
                showInlineCellField: function(tableData) {
                    var tbl = tableData;
                    var value = Liferay.RivetInlineCellEditor.getCellValue(tbl.activeCell);
                    tbl.activeCell.append(this.ELEMENT_TEMPLATE);
                    var field = tbl.activeCell.one('input');
                    field.removeClass('hidden');
                    field.set('value', value);
                    field.focus();
                }
            },
            ATTRS: {
                
                /**
                * 
                *
                * @attribute editable
                * @default false
                * @type Boolean
                */
                editable: {
                    value: true,
                    validator: A.Lang.isBoolean
                }
            }
        });
        
        Liferay.RivetInlineCellEditor = InlineCellEditor;
    
        Liferay.RivetInlineCellEditor.setCellValue = function(cell, value) {
            if (!cell.one('span.value')) {
                cell.empty();
                cell.append('<span class="value"></span>');
            }
            cell.one('span.value').set('text', value);
        };

        Liferay.RivetInlineCellEditor.getCellValue = function(cell) {
            if (cell.one('span.value')) {
                return cell.one('span.value').get('text');
            }
            // if first child node exists and it is dom type text
            if (cell.getDOMNode().childNodes[0] && cell.getDOMNode().childNodes[0].nodeType == 3) {
                return cell.getDOMNode().childNodes[0].textContent;
            }
            return '';
        };
        },
        '1.0',
        {
            requires: ['aui-arraysort', 'aui-datatable', 'datatable-sort', 'json', 'liferay-portlet-url', 'liferay-util-window', 'liferay-portlet-dynamic-data-lists']
        })
