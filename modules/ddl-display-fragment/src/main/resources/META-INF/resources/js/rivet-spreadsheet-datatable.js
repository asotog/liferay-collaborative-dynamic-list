AUI.add(
    'rivet-spreadsheet-datatable',
    function(A) {
        
        var HIGHLIGHTED_CELL = '.cell-highlight.current-user';
        var BORDER_COLOR1 = 'border-color';
        var BORDER_COLOR2 = 'box-shadow';

        var RivetSpreadSheet = A.Component.create({
            ATTRS: {
                highlightColor: {
                    value: '#3FC51B'
                }
            },
            
            CSS_PREFIX: 'table',
            
            EXTENDS: Liferay.SpreadSheet,
            
            NAME: A.DataTable.Base.NAME,
            
            prototype: {
                initializer: function() {
                    this.bindSpreadSheet();
                },
                
                /*
                * Attaches all the events to the spreadsheet table
                * 
                *
                */
                bindSpreadSheet: function() {
                    var instance = this;
                    instance.after('highlightColorChange', A.bind(instance._highlightColorChanged, instance));
                    instance.on('model:change', instance._onCellValueUpdate);
                    
                    instance.delegate(instance.get('editEvent'), function(e) {
                        var activeCell = instance.get('activeCell'),
                        alignNode = e.alignNode || activeCell,
                        column = instance.getColumn(alignNode),
                        record = instance.getRecord(alignNode),
                        editor = instance.getEditor(record, column);
                        if (!(editor instanceof Liferay.RivetInlineCellEditor)) {
                            return;
                        }
                        e.stopPropagation();
                        editor.editInlineCell({
                            activeCell: activeCell,
                            record: record,
                            column: column,
                            table: instance
                        });
                    }, '.' + instance.CLASS_NAMES_CELL_EDITOR_SUPPORT.cell, this);
                    
                    // highlight
                    instance.delegate('click', function(e) {
                        var cellList = instance.get('boundingBox').all(HIGHLIGHTED_CELL);
                        cellList.each(function() {
                            this.removeClass('current-user');
                            if (!this.hasAttribute('current-ref-class')) { // clean cell color if other user is not selecting same cell
                                cellList.setStyle(BORDER_COLOR1, '');
                                cellList.setStyle(BORDER_COLOR2, '');
                                cellList.removeClass('cell-highlight');
                                if (this.one('.cell-highlight-title')) {
                                    this.one('.cell-highlight-title').remove();
                                }
                            }
                        ;})
                        var cell = e.currentTarget;
                        if (!cell.hasAttribute('current-ref-class')) { // update cell color if other user not selecting same cell
                            instance._updateHighlightCellColor(cell);
                        }
                        instance._publishCellHighlight(cell);
                    }, '.' + instance.CLASS_NAMES_CELL_EDITOR_SUPPORT.cell, this);
                },
                
                /*
                * Triggers event with the give selected cell data
                * 
                *
                */
                _publishCellHighlight: function(cell) {
                    this.fire('cellHighlighted', this.getCellData(cell));
                },
                
                /*
                * Retrieves cell information such as record id and col name
                * 
                *
                */
                getCellData: function(cell) {
                    var col = cell.getDOMNode().className.match(/(^|\s)(table\-col\-[^\s]*)/)[0];
                    var record = cell.ancestor('tr').getAttribute('data-yui3-record');
                    return {col: col, record: record};
                },
                
                /*
                * Listens every record change, if editor cell not RivetInlineCellEditor, 
                * it triggers cellValueUpdated event
                * This method handles liferay default field types data changes
                */
                _onCellValueUpdate: function(e) {
                    var instance = this;
                    var column = instance.getColumn(instance.get('activeCell'));
                    var record = instance.getRecord(instance.get('activeCell'));
                    var editor = instance.getEditor(record, column);
                    if (editor instanceof Liferay.RivetInlineCellEditor) {
                        return;
                    }
                    // wait a bit for cell to be updated with the formatted val
                    window.setTimeout(function() {
                        var value = Liferay.RivetInlineCellEditor.getCellValue(instance.get('activeCell'));
                        var data = instance.getCellData(instance.get('activeCell'));
                        data.value = value;
                        data.rawValue = record.get(column.key);
                        instance.fire('cellValueUpdated', data);
                    }, 100);
                }, 

                /*
                * Listens the highlight color value changes
                * 
                *
                */
                _highlightColorChanged: function() {
                    if (this.get('boundingBox').one(HIGHLIGHTED_CELL)) {
                        this._updateHighlightCellColor(this.get('boundingBox').one(HIGHLIGHTED_CELL));
                    }
                },
                
                /*
                * Updates cell color
                * 
                *
                */
                _updateHighlightCellColor: function(cell) {
                    cell.addClass('cell-highlight').addClass('current-user');
                    cell.setStyle(BORDER_COLOR1, this.get('highlightColor'));
                    cell.setStyle(BORDER_COLOR2, this._getBoxShadow(this.get('highlightColor')));
                },

                _getBoxShadow: function (color) {
                    return `0 0 0 1px ${color}`;
                },
                
                
                /*
                * Updates cell color by give color parameter and puts title over the 
                * cell
                * 
                *
                */
                _updateTitledHighlightCellByClasses: function(data) {
                    if (data.cell) {
                        this.clearHighlightByCellRef(data);
                        
                        // if (data.cell.getAttribute('current-ref-class')
                        //     && data.refClass !== data.cell.getAttribute('current-ref-class')) {
                        //     return;
                        // }
                        this.addRef(data);
                        data.cell.addClass(data.refClass).addClass('cell-highlight');
                        data.cell.setStyle(BORDER_COLOR1, data.color);
                        data.cell.setStyle(BORDER_COLOR2, this._getBoxShadow(data.color));
                        data.cell.append('<span style="background-color: ' + data.color + 
                            ';" class="cell-highlight-title">' + data.title + '</span>')
                    }
                },

                // keep track of users highlighting same cell
                addRef: function({ cell, refClass, refValue }) {
                   let refs = cell.getAttribute('refs');
                   refs = refs ? refs.split(',') : [];
                   refs.push(refValue);
                   const distinct = (value, index, self) => self.indexOf(value) === index;
                   cell.setAttribute('refs', refs.filter(distinct).join(','));
                   cell.setAttribute('current-ref-class', refClass);
                },

                // remove highlight properly if multiple users highlighting same cell
                deleteRef: function({ cell, refClass, refKey, refValue, color }) {
                    // remove ref
                    let refs = cell.getAttribute('refs');
                    refs = refs ? refs.split(',') : [];
                    refs = refs.filter(ref => ref != refValue);
                    cell.setAttribute('refs', refs.join(','));
                    // update ui
                    cell.removeAttribute('current-ref-class');
                    cell.removeClass(refClass);
                    if (!cell.hasClass('current-user')) {
                        cell.removeClass('cell-highlight');
                    }
                    cell.setStyle(BORDER_COLOR1, '');
                    cell.setStyle(BORDER_COLOR2, '');
                    if (cell.one('.cell-highlight-title')) {
                        cell.one('.cell-highlight-title').remove();
                    }
                },

                /*
                * Removes cell highlight by given class
                */
                clearHighlightByCellRef: function({ refClass, refKey, refValue }) {
                    const instance = this;
                    this.get('boundingBox').all('.' + refClass).each(function() {
                        if (this.getAttribute('current-ref-class')
                            && refClass !== this.getAttribute('current-ref-class')) {
                            return;
                        }
                        instance.deleteRef({ cell: this, refClass, refKey, refValue })
                    });
                }
            }
        });
            
        RivetSpreadSheet.EXTENDS.TYPE_EDITOR = {
            'checkbox': A.CheckboxCellEditor,
            'ddm-date': A.DateCellEditor,
            'ddm-decimal': A.TextCellEditor,
            'ddm-integer': A.TextCellEditor,
            'ddm-number': A.TextCellEditor,
            'radio': A.RadioCellEditor,
            'select': A.DropDownCellEditor,
            'text': Liferay.RivetInlineCellEditor,
            'textarea': A.TextAreaCellEditor
        };

        Liferay.RivetSpreadSheet = RivetSpreadSheet;

        },
        '1.0',
        {
            requires: ['rivet-inline-cell', 'aui-arraysort', 'aui-datatable', 'datatable-sort', 'json', 'liferay-portlet-url', 'liferay-util-window', 'liferay-portlet-dynamic-data-lists']
        })
