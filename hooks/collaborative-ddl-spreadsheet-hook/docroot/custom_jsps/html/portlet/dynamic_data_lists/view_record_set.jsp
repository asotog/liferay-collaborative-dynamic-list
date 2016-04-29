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
  - this file is the same as original liferay 6.2 EE GA1
  - but instead of view_spreadsheet_records.jsp it loads view_collaboration_spreadsheet_records.jsp
  - TODO: load swift from regular spreadsheet to collaboration spreadsheet reading a configuration portlet value
--%>

<%@ include file="/html/portlet/dynamic_data_lists/init.jsp" %>

<%
String redirect = ParamUtil.getString(request, "redirect");

DDLRecordSet recordSet = (DDLRecordSet)request.getAttribute(WebKeys.DYNAMIC_DATA_LISTS_RECORD_SET);

long displayDDMTemplateId = ParamUtil.getLong(request, "displayDDMTemplateId");

boolean spreadsheet = ParamUtil.getBoolean(request, "spreadsheet");
%>

<liferay-ui:header
	backURL="<%= redirect %>"
	localizeTitle="<%= false %>"
	title="<%= recordSet.getName(locale) %>"
/>

<c:choose>
	<c:when test="<%= displayDDMTemplateId > 0 %>">
		<liferay-util:include page="/html/portlet/dynamic_data_lists/view_template_records.jsp" />
	</c:when>
	<c:otherwise>
		<c:choose>
			<c:when test="<%= spreadsheet %>">
        <%-- CUSTOM: loading collaboration spreadsheet records instead of LR original impl --%>
				<%-- <liferay-util:include page="/html/portlet/dynamic_data_lists/view_spreadsheet_records.jsp" /> --%>
        <liferay-util:include page="/html/portlet/dynamic_data_lists/view_collaboration_spreadsheet_records.jsp" />
			</c:when>
			<c:otherwise>
				<liferay-util:include page="/html/portlet/dynamic_data_lists/view_records.jsp" />
			</c:otherwise>
		</c:choose>
	</c:otherwise>
</c:choose>

<%
if (portletName.equals(PortletKeys.DYNAMIC_DATA_LISTS)) {
	PortalUtil.setPageSubtitle(recordSet.getName(locale), request);
	PortalUtil.setPageDescription(recordSet.getDescription(locale), request);
}

PortalUtil.addPortletBreadcrumbEntry(request, recordSet.getName(locale), currentURL);
%>
