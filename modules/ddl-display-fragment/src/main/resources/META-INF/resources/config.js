;(function() {
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
					'rivet-spreadsheet-datatable.js' : {
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