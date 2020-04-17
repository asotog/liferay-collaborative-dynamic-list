package com.rivetlogic.spreadsheet.realtime.api;

import java.util.Map.Entry;
import java.util.concurrent.ConcurrentMap;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.service.UserLocalServiceUtil;

public class SpreadsheetUtil {
	
	public static final String SESSIONID = "sessionId";
	public static final String GUEST_USER_NAME_LABEL = "rivetlogic.spreadsheet.guest.name.label";
	public static final String LOGGED_USERS_MAP_KEY = "rivetlogic.spreadsheet.logged.users.map";
	public static final String SHEET_MAP_KEY = "rivetlogic.spreadsheet.sheet.map";
	public static final String HIGHLIGHT_CELLS_SHEET_MAP_KEY = "rivetlogic.spreadsheet.highlighted.sheet.map";
	public static final String SHEET_SESSIONS_KEY = "rivetlogic.spreadsheet.sheet.sessions";
	/* ACTIONS */
	public static final String LOGIN = "login";
	public static final String CELL_HIGHLIGHTED = "cellHighlighted";
	public static final String CELL_VALUE_UPDATED = "cellValueUpdated";
	public static final String ROW_ADDED = "rowsAdded";
	public static final String LAST_ROW_DELETED = "lastRowDeleted";

	/* JSON PROPERTIES */
	public static final String USERS = "users";
	public static final String HIGHLIGHTED_CELLS = "highlightedCells";
	public static final String UNLOGGED_USER = "unloggedUser";
	public static final String USER_ID = "userId";
	public static final String TYPE = "type";
	public static final String USERNAME = "userName";
	public static final String USER_IMAGEPATH = "userImagePath";
	public static final String BASE_IMAGEPATH = "baseImagePath";
	public static final String COMMANDS = "commands";
	public static final String CACHEID = "cacheId";
	public static final String ACTION = "action";

	private static final Log LOG = LogFactoryUtil.getLog(SpreadsheetUtil.class);

	/**
	 * Generate JSON from current logged users map.
	 * 
	 * @param loggedUserMap
	 * @return
	 */
	public static JSONObject generateLoggedUsersJSON(ConcurrentMap<String, UserData> loggedUserMap,
		ConcurrentMap<String, JSONObject> highlightedCellsByUsers) {
		JSONObject usersLogged = JSONFactoryUtil.createJSONObject();
		JSONObject usersUpdateCommand = JSONFactoryUtil.createJSONObject();
		JSONArray commands = JSONFactoryUtil.createJSONArray();
		JSONArray users = JSONFactoryUtil.createJSONArray();
		JSONArray highlightedCells = JSONFactoryUtil.createJSONArray();

		usersUpdateCommand.put(ACTION, USERS);

		for (Entry<String, UserData> entry : loggedUserMap.entrySet()) {
			String key = entry.getKey();
			UserData userData = entry.getValue();
			JSONObject user = JSONFactoryUtil.createJSONObject();
			LOG.debug(user);
			user.put(USERNAME, userData.getUserName());
			user.put(USER_IMAGEPATH, userData.getUserImagePath());
			user.put(USER_ID, userData.getUserId());
			user.put(SESSIONID, key);
			users.put(user);
		}

		usersUpdateCommand.put(USERS, users);

		for (Entry<String, JSONObject> entry : highlightedCellsByUsers.entrySet()) {
			JSONObject highlightedCell = entry.getValue();
			highlightedCells.put(highlightedCell);
		}

		usersUpdateCommand.put(HIGHLIGHTED_CELLS, highlightedCells);

		/* add to commands */
		commands.put(usersUpdateCommand);

		/* add commands to main json */
		usersLogged.put(COMMANDS, commands);

		LOG.debug(usersLogged.toString());

		return usersLogged;

	}

	public static JSONObject generateCommands(JSONObject newCommand) {
		JSONObject jsonObj = JSONFactoryUtil.createJSONObject();
		JSONArray commands = JSONFactoryUtil.createJSONArray();

		commands.put(newCommand);

		/* add commands to main json */
		jsonObj.put(COMMANDS, commands);

		LOG.debug(jsonObj.toString());

		return jsonObj;
	}
	
	/**
     * Gets Liferay User by userId
     * 
     * @param userId {long}
     * @return User
     */
    public static User getUser(long userId) {
    	try {
			return UserLocalServiceUtil.getUser(Long.valueOf(userId));
		} catch (PortalException e) {
			e.printStackTrace();
		}
    	return null;
    }
}
