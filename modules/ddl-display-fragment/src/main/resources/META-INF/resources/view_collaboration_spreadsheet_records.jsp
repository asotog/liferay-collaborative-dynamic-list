<%--
/**
 * Copyright (C) 2005-2014 Rivet Logic Corporation.
 * 
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation; version 3 of the License.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, write to the Free Software Foundation, Inc., 51
 */
--%>
<%--
    NOTE:
    - this is a custom rivet logic file
--%>

<%@ include file="/init.jsp" %>
<%@ page import="com.liferay.portal.kernel.util.HttpUtil" %>

<%
DDLRecordSet recordSet = (DDLRecordSet)request.getAttribute(DDLWebKeys.DYNAMIC_DATA_LISTS_RECORD_SET);
boolean editable = ParamUtil.getBoolean(request, "editable", true);
if (editable || ddlDisplayContext.isAdminPortlet()) {
    editable = DDLRecordSetPermission.contains(permissionChecker, recordSet.getRecordSetId(), DDLActionKeys.ADD_RECORD) && DDLRecordSetPermission.contains(permissionChecker, recordSet.getRecordSetId(), ActionKeys.UPDATE);
}
DDMStructure ddmStructure = recordSet.getDDMStructure();
%>

<% 
int rivetts = 20180216; // avoid caching on css and js 2
String MODULE_PATH = "/o/dynamic-data-lists-web";

String userImagePath = user.getPortraitURL(themeDisplay);

// Read WS Custom Config
boolean wsSecured = PrefsParamUtil.getBoolean(PortletPreferencesFactoryUtil.getPortletSetup(renderRequest), renderRequest, "wssecured");
boolean wsUsecustomurl = PrefsParamUtil.getBoolean(PortletPreferencesFactoryUtil.getPortletSetup(renderRequest), renderRequest, "wsusecustomurl");
String wsCustombasepath = PrefsParamUtil.getString(PortletPreferencesFactoryUtil.getPortletSetup(renderRequest), renderRequest, "wscustombasepath");

String baseWebsocketURL = request.getServerName() + ":" + request.getServerPort();
if (wsUsecustomurl) {
    baseWebsocketURL = baseWebsocketURL + wsCustombasepath;
}

String webSocketProtocol = "ws://";
if (wsSecured) {
    webSocketProtocol = "wss://";
}

String websocketURL = webSocketProtocol + baseWebsocketURL + "/o/collaboration-spreadsheet";

websocketURL = HttpUtil.addParameter(websocketURL, "userId", user.getUserId());
websocketURL = HttpUtil.addParameter(websocketURL, "userImagePath", userImagePath);
websocketURL = HttpUtil.addParameter(websocketURL, "guestLabel",  LanguageUtil.get(request, "guest"));

%>
<style type="text/css">
@import url("<%= MODULE_PATH %>/css/rivet-collaboration-spreadsheet.css?t=<%= rivetts %>");
</style>
<script id="spreadsheet-online-users" type="text/x-handlebars-template">
    <ul class="unstyled">
        {{#each users}}
        <li>
            <a href="" class="user-portrait">
                <img style="border-color: {{color}} !important;" src="{{userImagePath}}" alt="">
                <span style="background-color: {{color}};" class="user-info">{{userName}}</span>                                                    
            </a>
        </li>
        {{/each}}
    </ul>
</script>
<div class="container-fluid-1280 lfr-spreadsheet-container">
    <div id="<portlet:namespace />spreadsheet" class="realtime-spreadsheet">
        <div class="connection-lost-alert alert alert-danger hidden" role="alert">Connection was lost please refresh the page. <a href="javascript:document.location.reload()">Reload</a></div>
        <div class="communication-unsupported-alert alert alert-danger hidden" role="alert">Communication protocol not supported by your current browser. Please try <a href="http://caniuse.com/#search=websocket" target="_blank">supported</a> browser</div>
	    <input type="hidden" id="record_set_id" value="<%= recordSet.getRecordSetId() %>">
        <div class="collaboration-users"></div>
        <div class="table-striped yui3-widget yui3-datatable" id="<portlet:namespace />dataTable">
            <div class="yui3-datatable-scrollable yui3-datatable-content" id="<portlet:namespace />dataTableContent"></div>
        </div>
    </div>

    <c:if test="<%= editable %>">
        <div class="lfr-spreadsheet-add-rows-buttons">
            <aui:button inlineField="<%= true %>" name="addRecords" value="add" />

            <aui:select inlineField="<%= true %>" label="more-rows-at-bottom" name="numberOfRecords">
                <aui:option label="1" />
                <aui:option label="5" />
                <aui:option label="10" />
                <aui:option label="20" />
                <aui:option label="50" />
            </aui:select>
        </div>
        <aui:button cssClass="remove-last-row-btn btn-warning" inlineField="<%= true %>" name="removeLastRow" value="Remove Last Row" />
    </c:if>
</div>

<%@ include file="/custom_spreadsheet_editors.jspf" %>
<%-- CUSTOM  --%>

<script>
(function() {
	var MODULE_PATH = '<%= MODULE_PATH %>';
	AUI().applyConfig({
	    groups : {
	        'collaboration-spreadsheet' : {
	            base : MODULE_PATH + '/js/',
	            combine : Liferay.AUI.getCombine(),
	            modules : {
	                'rivet-collaboration-spreadsheet' : {
	                    path : 'rivet-collaboration-spreadsheet.js',
	                    requires : []
	                },
	                'rivet-inline-cell' : {
	                    path : 'rivet-inline-cell.js',
	                    requires : []
	                },
	                'rivet-spreadsheet-datatable' : {
	                    path : 'rivet-spreadsheet-datatable.js',
	                    requires : []
	                },
	                'rivet-users-color' : {
	                    path : 'rivet-users-color.js',
	                    requires : []
	                },
	            },
	            root : MODULE_PATH + '/js/'
	        }
	    }
	});
})();
</script>
<aui:script use="rivet-collaboration-spreadsheet">
var structure = <%= DDMUtil.getDDMFormFieldsJSONArray(ddmStructure, ddmStructure.getDefinition()) %>;
var columns = Liferay.SpreadSheet.buildDataTableColumns(<%= ddlDisplayContext.getRecordSetJSONArray(recordSet, locale) %>, '<%= LocaleUtil.toLanguageId(locale) %>', structure, <%= editable %>);
// var columns = Liferay.SpreadSheet.buildDataTableColumns(<%= ddlDisplayContext.getRecordSetJSONArray(recordSet, locale) %>, structure, <%= editable %>);

var ignoreEmptyRecordsNumericSort = function(recA, recB, desc, field) {
    var a = recA.get(field);
    var b = recB.get(field);

    return A.ArraySort.compareIgnoreWhiteSpace(
        a,
        b,
        desc,
        function(a, b, desc) {
            var num1 = parseFloat(a);
            var num2 = parseFloat(b);

            var result;

            if (isNaN(num1) || isNaN(num2)) {
                result = A.ArraySort.compare(a, b, desc);
            }
            else {
                result = desc ? (num2 - num1) : (num1 - num2);
            }

            return result;
        }
    );
};

var ignoreEmptyRecordsStringSort = function(recA, recB, desc, field) {
    var a = recA.get(field);
    var b = recB.get(field);

    return A.ArraySort.compareIgnoreWhiteSpace(a, b, desc);
};

var numericData = {
    'double': 1,
    integer: 1,
    number: 1
};

var keys = columns.map(
    function(item, index) {
        var key = item.key;

        if (!item.sortFn) {
            if (numericData[item.dataType]) {
                item.sortFn = A.rbind(ignoreEmptyRecordsNumericSort, item, key);
            }
            else {
                item.sortFn = A.rbind(ignoreEmptyRecordsStringSort, item, key);
            }
        }

        return key;
    }
);

<%
int status = WorkflowConstants.STATUS_APPROVED;

if (DDLRecordSetPermission.contains(permissionChecker, recordSet, DDLActionKeys.ADD_RECORD)) {
    status = WorkflowConstants.STATUS_ANY;
}

List<DDLRecord> records = DDLRecordLocalServiceUtil.getRecords(recordSet.getRecordSetId(), status, 0, 1000, null);
%>

var records = <%= ddlDisplayContext.getRecordsJSONArray(records, !editable, locale) %>;

records.sort(
    function(a, b) {
        return (a.displayIndex - b.displayIndex);
    }
);

var data = Liferay.SpreadSheet.buildEmptyRecords(<%= Math.max(recordSet.getMinDisplayRows() - records.size(), 0) %>, keys);

records.forEach(
    function(item, index) {
        data.splice(item.displayIndex, 0, item);
    }
);

var editAction = A.one('html').hasClass('touch') ? 'click' : 'dblclick';

var spreadSheet = new Liferay.RivetCollaborationSpreadSheet(
    {
        websocketAddress: '<%= websocketURL %>',
        boundingBox: '#<portlet:namespace />dataTable',
        columns: columns,
        contentBox: '#<portlet:namespace />dataTableContent',
        data: data,
        editEvent: editAction,
        plugins: [
            {
                fn: A.Plugin.DataTableHighlight,
                cfg: {
                    highlightRange: false
                }
            }
        ],
        strings: {
            asc: '<liferay-ui:message key="ascending" />',
            desc: '<liferay-ui:message key="descending" />',
            reverseSortBy: '<liferay-ui:message arguments="{column}" key="reverse-sort-by-x" />',
            sortBy: '<liferay-ui:message arguments="{column}" key="sort-by-x" />'
        },
        recordsetId: <%= recordSet.getRecordSetId() %>,
        structure: structure,
        width: '100%'
    }
);

spreadSheet.render('#<portlet:namespace />spreadsheet');

spreadSheet.get('boundingBox').unselectable();

<c:if test="<%= editable %>">
    var numberOfRecordsNode = A.one('#<portlet:namespace />numberOfRecords');

    A.one('#<portlet:namespace />addRecords').on(
        'click',
        function(event) {
            var numberOfRecords = parseInt(numberOfRecordsNode.val(), 10) || 0;
            
            spreadSheet.addEmptyRows(numberOfRecords);
            <%-- Custom callback added when response returns broadcast message to the rest of the users connected --%>
            spreadSheet.updateMinDisplayRows(spreadSheet.get('data').size(), function() {
                spreadSheet.addEmptyRowsAndBroadcast(numberOfRecords);
            });
        }
    );
    /* Rivetlogic added this */
    A.one('#<portlet:namespace />removeLastRow').on(
        'click',
        function(event) {
            if (spreadSheet.get('data').size() <= 1) { // should have more than 1 row in order to delete last row action
                return;
            }
            var currentSize = spreadSheet.get('data').size();
            spreadSheet.get('data').remove(currentSize - 1);
            <%-- Custom callback added when response returns broadcast message to the rest of the users connected --%>
            spreadSheet.updateMinDisplayRows(currentSize - 1, function() {
                spreadSheet.removeLastRowAndBroadcast();
            });
        }
    );
</c:if>

spreadSheet.on('connectionClosed', function() {
	A.one('.realtime-spreadsheet .connection-lost-alert').removeClass('hidden');
});

if (!spreadSheet.supported) {
	A.one('.realtime-spreadsheet .communication-unsupported-alert').removeClass('hidden');
};

// reset realtime spreadsheet model clientId
Liferay.on('beforeNavigate', function (event) {
	Liferay.RivetCollaborationSpreadSheet.resetClientIdFromModel();
});

window.<portlet:namespace />spreadSheet = spreadSheet;
window.<portlet:namespace />structure = structure;
</aui:script>
<%--  end:CUSTOM --%>