package com.rivetlogic.spreadsheet.realtime.api;

import javax.websocket.CloseReason;
import javax.websocket.Endpoint;
import javax.websocket.EndpointConfig;
import javax.websocket.Session;

import org.osgi.service.component.annotations.Component;

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

	@Override
	public void onOpen(Session session, EndpointConfig config) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onClose(Session session, CloseReason closeReason) {
		// TODO Auto-generated method stub
		super.onClose(session, closeReason);
	}

}