AUI.add(
    'rivet-users-color',
    function(A) {
        
        var UsersColors = {
            COLORS: [],
            /* users colors map (userId,color), so when more users join
               it picks a color already set for the specific users
            */
            USERS_COLORS: {},
            generateColors: function() {
                var N_COLORS = 100;
                var colors = [];
                for (var i = 0; i < N_COLORS; i++) {
                    var color = [];
                    for(var j = 0; j < 3; j++) {
                        color.push(Math.floor(Math.random() * 255));
                    }
                    colors.push('rgb(' + color.join(',') + ')');
                };
                return colors;
            },
            pickColor: function(userId) {
                if (UsersColors.USERS_COLORS[userId]) {
                    return UsersColors.USERS_COLORS[userId];
                };
                var i = Math.floor(Math.random() * UsersColors.COLORS.length);
                UsersColors.USERS_COLORS[userId] = UsersColors.COLORS.splice(i, 1)[0];
                return UsersColors.USERS_COLORS[userId];
            }
        };
        UsersColors.COLORS = UsersColors.generateColors();

        A.UsersColors = UsersColors;
        },
    	'',
    	{
    		requires: []
    	})
