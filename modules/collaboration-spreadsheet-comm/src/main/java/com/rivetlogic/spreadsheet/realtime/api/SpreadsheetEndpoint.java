package com.rivetlogic.spreadsheet.realtime.api;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ConcurrentSkipListMap;

import javax.websocket.CloseReason;
import javax.websocket.Endpoint;
import javax.websocket.EndpointConfig;
import javax.websocket.MessageHandler;
import javax.websocket.Session;

import org.osgi.service.component.annotations.Component;

import com.liferay.portal.kernel.cache.MultiVMPoolUtil;
import com.liferay.portal.kernel.cache.PortalCache;
import com.liferay.portal.kernel.json.JSONException;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.util.HttpUtil;
import com.liferay.portal.kernel.util.StringPool;

/**
 * @author alejandrosoto
 */
@Component(
		immediate = true,
		property = {
			"org.osgi.http.websocket.endpoint.path=" + SpreadsheetEndpoint.PATH
		},
		service = Endpoint.class
	)
public class SpreadsheetEndpoint extends Endpoint {
	public static final String PATH = "/o/collaboration-spreadsheet";
	public static final String CACHE_NAME = SpreadsheetEndpoint.class.getName();
	@SuppressWarnings("rawtypes")
	private static PortalCache portalCache = MultiVMPoolUtil.getPortalCache(CACHE_NAME);

	private static final Log LOG = LogFactoryUtil.getLog(SpreadsheetEndpoint.class);

	@Override
	public void onOpen(Session session, EndpointConfig config) {
		// connection url query string parameters map
		Map<String, String[]> parameters = HttpUtil.getParameterMap(session.getQueryString());
		// user parameters
		String userId = parameters.get("userId")[0];
		String userImagePath = parameters.get("userImagePath")[0];
		String guestLabel = parameters.get("guestLabel")[0];
		String sheetId = parameters.get("sheetId")[0];
		// currentUser {User}
		User currentUser = SpreadsheetUtil.getUser(Long.valueOf(userId));
		String userName = StringPool.BLANK;

		ConcurrentMap<String, UserData> loggedUserMap = getLoggedUsersMap(sheetId);
		ConcurrentMap<String, Session> sessions = getSessions(sheetId);
		
		if (loggedUserMap.get(session.getId()) == null && currentUser != null) {
			LOG.debug("base image path " + userImagePath + " sheet id " + sheetId);
			if (currentUser.isDefaultUser()) {
				LOG.debug("This is guest user");
				userName = guestLabel;
			} else {
				userName = currentUser.getFullName();
			}
			LOG.debug(String.format("User full name: %s, User image path: %s", userName, userImagePath));
			loggedUserMap.put(session.getId(), new UserData(userName, userImagePath, userId));
			sessions.put(session.getId(), session);
			
			/* adds message handler on current opened session */
			session.addMessageHandler(new MessageHandler.Whole<String>() {

				@Override
				public void onMessage(String text) {
					onMessageHandler(text, sheetId);
				}

			});
		}

	}
	
	private void onMessageHandler(String text, String sheetId) {
		ConcurrentMap<String, UserData> loggedUserMap = getLoggedUsersMap(sheetId);
		ConcurrentMap<String, Session> sessions = this.getSessions(sheetId);
		try {
			JSONObject jsonMessage = JSONFactoryUtil.createJSONObject(text);
			
			/* verify if user is signing in */
			if (SpreadsheetUtil.LOGIN.equals(jsonMessage
					.getString(SpreadsheetUtil.ACTION))) {
				JSONObject usersLoggedMessage = SpreadsheetUtil
						.generateLoggedUsersJSON(loggedUserMap);
				this.broadcast(usersLoggedMessage.toString(), sessions);
			} else if (SpreadsheetUtil.CELL_HIGHLIGHTED
					.equals(jsonMessage
							.getString(SpreadsheetUtil.ACTION))) { // may be we can remove this as below code is funcioning same.
				/* just broadcast the message */
				this.broadcast(SpreadsheetUtil.generateCommands(jsonMessage).toString(), sessions);
			} else if (SpreadsheetUtil.CELL_VALUE_UPDATED
					.equals(jsonMessage
							.getString(SpreadsheetUtil.ACTION))) { // may be we can remove this as below code is funcioning same.
				/* just broadcast the message */
				this.broadcast(SpreadsheetUtil.generateCommands(jsonMessage).toString(), sessions);
			} else if (SpreadsheetUtil.ROW_ADDED
					.equals(jsonMessage
							.getString(SpreadsheetUtil.ACTION))) {
				/* just broadcast the message */
				this.broadcast(SpreadsheetUtil.generateCommands(jsonMessage).toString(), sessions);
			} else if (SpreadsheetUtil.LAST_ROW_DELETED
					.equals(jsonMessage
							.getString(SpreadsheetUtil.ACTION))) {
				/* just broadcast the message */
				this.broadcast(SpreadsheetUtil.generateCommands(jsonMessage).toString(), sessions);
			} else {
				this.broadcast(jsonMessage.toString(), sessions);
			}
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	@Override
	public void onClose(Session session, CloseReason closeReason) {
		// TODO Auto-generated method stub
		super.onClose(session, closeReason);
		
		// connection url query string parameters map
		Map<String, String[]> parameters = HttpUtil.getParameterMap(session.getQueryString());
		// user parameters
		String sheetId = parameters.get("sheetId")[0];
		ConcurrentMap<String, UserData> loggedUserMap = this.getLoggedUsersMap(sheetId);
		ConcurrentMap<String, Session> sessions = this.getSessions(sheetId);
		
		loggedUserMap.remove(session.getId());
		sessions.remove(session.getId());
		
		JSONObject usersLoggedMessage = SpreadsheetUtil
				.generateLoggedUsersJSON(loggedUserMap);
		this.broadcast(usersLoggedMessage.toString(), sessions);
	}
	
	/**
	 * Retrieves logged users from cache
	 * 
	 * @return
	 */
	@SuppressWarnings("unchecked")
	private ConcurrentMap<String, UserData> getLoggedUsersMap(String sheetId) {
		Object sheet = portalCache
				.get(SpreadsheetUtil.SHEET_MAP_KEY);
		
		ConcurrentMap<String, ConcurrentMap<String, UserData>> sheetUserMap = (ConcurrentMap<String, ConcurrentMap<String, UserData>>) sheet;
		if (null == sheetUserMap) {
			sheetUserMap = new ConcurrentSkipListMap<String, ConcurrentMap<String, UserData>>();
			portalCache.put(SpreadsheetUtil.SHEET_MAP_KEY,
					sheetUserMap);
		}
		
		
		ConcurrentMap<String, UserData> object = sheetUserMap.get(sheetId); 
		
		ConcurrentMap<String, UserData> loggedUserMap = (ConcurrentMap<String, UserData>) object;
		if (null == loggedUserMap) {
			loggedUserMap = new ConcurrentSkipListMap<String, UserData>();
			sheetUserMap.put(sheetId,
					loggedUserMap);
		}
		return loggedUserMap;
	}
	
	/**
	 * Retrieves logged users from cache
	 * 
	 * @return
	 */
	@SuppressWarnings("unchecked")
	private ConcurrentMap<String, Session> getSessions(String sheetId) {
		Object sheet = portalCache.get(SpreadsheetUtil.SHEET_SESSIONS_KEY);
		
		ConcurrentMap<String, ConcurrentMap<String, Session>> sheetSessionsMap = (ConcurrentMap<String, ConcurrentMap<String, Session>>) sheet;
		if (null == sheetSessionsMap) {
			sheetSessionsMap = new ConcurrentSkipListMap<String, ConcurrentMap<String, Session>>();
			portalCache.put(SpreadsheetUtil.SHEET_SESSIONS_KEY, sheetSessionsMap);
		}

		ConcurrentMap<String, Session> object = sheetSessionsMap.get(sheetId); 
		
		ConcurrentMap<String, Session> sessionsMap = (ConcurrentMap<String, Session>) object;
		if (null == sessionsMap) {
			sessionsMap = new ConcurrentSkipListMap<String, Session>();
			sheetSessionsMap.put(sheetId, sessionsMap);
		}
		return sessionsMap;
	}
	
	/**
	 * Sends message to every opened session
	 * 
	 * @param message
	 * @param sessions
	 */
	private void broadcast(String message, Map<String, Session> sessions) {
		try {
			for (Session session : sessions.values()) {
				session.getBasicRemote().sendText(message);
			}
		} catch (IOException ioe) {
			throw new RuntimeException(ioe);
		}
	}

}