package com.rivetlogic.portlet.spreadsheet.atmosphere;

import java.util.Map.Entry;
import java.util.concurrent.ConcurrentMap;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.rivetlogic.portlet.spreadsheet.atmosphere.model.UserData;

public class SpreadSheetHandlerUtil {
	public static final String SESSIONID = "sessionId";
	public static final String GUEST_USER_NAME_LABEL = "rivetlogic.spreadsheet.guest.name.label";
	public static final String LOGGED_USERS_MAP_KEY = "rivetlogic.spreadsheet.logged.users.map";
	public static final String SHEET_MAP_KEY = "rivetlogic.spreadsheet.sheet.map";
	
	/* ACTIONS */
    public static final String LOGIN = "login";
    public static final String CELL_HIGHLIGHTED = "cellHighlighted";
    public static final String CELL_VALUE_UPDATED = "cellValueUpdated";
    public static final String ROW_ADDED = "rowsAdded";
    
	/* JSON PROPERTIES */
	public static final String USERS = "users";
	public static final String UNLOGGED_USER = "unloggedUser";
	public static final String USER_ID = "userId";
    public static final String TYPE = "type";
    public static final String USERNAME = "userName";
    public static final String USER_IMAGEPATH = "userImagePath";
    public static final String BASE_IMAGEPATH = "baseImagePath";
    public static final String COMMANDS = "commands";
    public static final String CACHEID = "cacheId";
    public static final String ACTION = "action";
    
	private static final Log LOG = LogFactoryUtil.getLog(SpreadSheetHandlerUtil.class);
	
	/**
     * Generate JSON from current logged users map.
     * 
     * @param loggedUserMap
     * @return
     */
    public static JSONObject generateLoggedUsersJSON(ConcurrentMap<String, UserData> loggedUserMap) {
        JSONObject usersLogged = JSONFactoryUtil.createJSONObject();
        JSONObject usersUpdateCommand = JSONFactoryUtil.createJSONObject();
        JSONArray commands = JSONFactoryUtil.createJSONArray();
        JSONArray users = JSONFactoryUtil.createJSONArray();

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

        /* add to commands */
        commands.put(usersUpdateCommand);

        /* add commands to main json */
        usersLogged.put(COMMANDS, commands);

        LOG.debug(usersLogged.toString());

        return usersLogged;

    }
    
    /**
     * Generates json object from regular logged users list but adding an unlogged user when gets disconnected 
     * 
     * @param loggedUserMap
     * @param unloggedUserData
     * @return
     */
    public static JSONObject generateLoggedAndUnloggedUsersJSON(ConcurrentMap<String, UserData> loggedUserMap, UserData unloggedUserData) {
    	JSONObject usersJSON = SpreadSheetHandlerUtil.generateLoggedUsersJSON(loggedUserMap);
    	JSONObject usersUpdateCommand = usersJSON.getJSONArray(COMMANDS).getJSONObject(0);
    	
    	if(unloggedUserData != null){ // as this has been updated to avoid NPE
    	JSONObject unloggedUser = JSONFactoryUtil.createJSONObject();
        LOG.debug(unloggedUser);
        unloggedUser.put(USERNAME, unloggedUserData.getUserName());
        unloggedUser.put(USER_IMAGEPATH, unloggedUserData.getUserImagePath());
        unloggedUser.put(USER_ID, unloggedUserData.getUserId());
        unloggedUser.put(SESSIONID, "");
    	
        usersUpdateCommand.put(UNLOGGED_USER, unloggedUser);
    	}
        
    	return usersJSON;
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

}