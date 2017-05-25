package com.rivetlogic.spreadsheet.realtime.api;

public class UserData {
	private String userName;
	private String userImagePath;
	private String userId;

	public UserData(String userName, String userImagePath, String userId) {

		super();
		this.userName = userName;
		this.userImagePath = userImagePath;
		this.userId = userId;
	}

	public String getUserName() {

		return userName;
	}

	public void setUserName(String userName) {

		this.userName = userName;
	}

	public String getUserImagePath() {

		return userImagePath;
	}

	public void setUserImagePath(String userImagePath) {

		this.userImagePath = userImagePath;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}
}
