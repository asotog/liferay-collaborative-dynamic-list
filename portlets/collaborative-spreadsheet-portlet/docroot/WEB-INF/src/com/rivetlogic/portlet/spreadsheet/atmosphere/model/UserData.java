package com.rivetlogic.portlet.spreadsheet.atmosphere.model;

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
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 */


/**
 * Value Object for user.
 * 
 * @author alejandro soto
 * 
 */
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