package com.rivetlogic.portlet.spreadsheet.atmosphere;

import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.rivetlogic.portlet.spreadsheet.atmosphere.model.UserData;

import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ConcurrentSkipListMap;

import org.atmosphere.cpr.AtmosphereResourceEvent;
import org.atmosphere.cpr.AtmosphereResourceEventListener;

public class SpreadSheetResourceEventListener implements AtmosphereResourceEventListener {
	private static final Log LOG = LogFactoryUtil
			.getLog(SpreadSheetResourceEventListener.class);
	/**
     * List of logged users.
     */
    private ConcurrentMap<String, UserData> loggedUserMap = new ConcurrentSkipListMap<String, UserData>();

    /**
     * Relates current connected user with the list of users.
     */
    private String sessionId = null;
	
	public SpreadSheetResourceEventListener(ConcurrentMap<String, UserData> loggedUserMap, String sessionId) {
		this.loggedUserMap = loggedUserMap;
        this.sessionId = sessionId;
	}
	
	@Override
	public void onBroadcast(AtmosphereResourceEvent arg0) {
		//LOG.info("braoadcasted "+ arg0);
	}

	@Override
	public void onClose(AtmosphereResourceEvent arg0) {
		//LOG.info("onClose "+ arg0);
	}

	@Override
	public void onDisconnect(AtmosphereResourceEvent event) {
		/* removes user from map and broadcast users list again */
		UserData unloggedUser = this.loggedUserMap.get(sessionId);
		this.loggedUserMap.remove(sessionId);
		JSONObject users = SpreadSheetHandlerUtil.generateLoggedAndUnloggedUsersJSON(loggedUserMap, unloggedUser);
		//LOG.debug("onMessage "+ users);
		//LOG.debug("onDisconnect "+ event);
        event.getResource().getBroadcaster().broadcast(users);

	}

	@Override
	public void onPreSuspend(AtmosphereResourceEvent arg0) {
		//LOG.info("onPreSuspend "+ arg0);
		
	}

	@Override
	public void onResume(AtmosphereResourceEvent arg0) {
		//LOG.info("onResume "+ arg0);
		
	}

	@Override
	public void onSuspend(AtmosphereResourceEvent arg0) {
		//LOG.info("onSuspend "+ arg0);
		
	}

	@Override
	public void onThrowable(AtmosphereResourceEvent arg0) {
		// TODO Auto-generated method stub
		
	}

	public void onHeartbeat(AtmosphereResourceEvent arg0) {
		//LOG.info("onHeartbeat "+ arg0);
		
	}

}
