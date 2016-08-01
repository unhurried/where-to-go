(function() {
	'use strict';

	angular
		.module('whereToGo')
		.service('CsvExporter', CsvExporter);

	/** @ngInject */
	function CsvExporter($window) {
		this.export = function(object, keys) {

			// Serialize a header.
			var content = keys.join(',') + "\n";
			// Serialize rows.
			angular.forEach(object, function(properties){
				var row = '';
				angular.forEach(keys, function(key, index){
					if (index != 0) { row += ','; }
					if (properties[key]) { row += properties[key]; }
				});
				content += (row + "\n");
			});

			// Convert text to blob object with Blob API.
			var blob = new Blob([ content ], { "type" : "text/csv" });

			// For Internet Expolorer
			if ($window.navigator.msSaveBlob) { 
				$window.navigator.msSaveBlob(blob, "export.csv"); 

			// For other browsers
			} else {
				var link = $window.document.getElementById("csv_exporter");

				if (link == null) { 
					link = $window.document.createElement("a");
					link.setAttribute("id", "csv_exporter");
					link.setAttribute("style", "display:none;");
					link.setAttribute("download", "export.csv");
				}

				link.setAttribute("href", $window.URL.createObjectURL(blob));
				link.click();
			}
		};
	}
})() 
