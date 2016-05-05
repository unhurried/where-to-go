(function() {
	'use strict';

	angular
		.module('whereToGo')
		.controller('MainController', MainController);

	/** @ngInject */
	function MainController($scope, $modal, localStorageService, DTOptionsBuilder, DTColumnDefBuilder) {
		var vm = this;

		/* datatables */

		vm.dtOptions = DTOptionsBuilder.newOptions();
		vm.DTColumnDefs = [
			DTColumnDefBuilder.newColumnDef(2).withOption("sType", "num"),
			DTColumnDefBuilder.newColumnDef(3).withOption("sType", "num")
		];

		/* private */

		vm.geocode = function(name, callback) {
			if(name == null || name == "") {
				callback({});
			}

			var geocoder = new google.maps.Geocoder();
			geocoder.geocode({'address': name}, function(results, status) {
				if(status == 'OK') {
					var latitude = results[0].geometry.location.lat();
					var longitude = results[0].geometry.location.lng();
					callback({ "latitude": latitude, "longitude": longitude });
				}
			});
		};

		/* home */

		vm.home = localStorageService.get('home');
		vm.home = vm.home || {};
		vm.homeForm = vm.home;

		$scope.$watch(function(){
			return vm.home;
		}, function () {
			localStorageService.set('home', vm.home);
		}, true);

		vm.showHomeForm = function() {
			vm.homeModalInstance = $modal.open({
				templateUrl: "homeForm",
				scope: $scope
			});
		};

		vm.geocodeHome = function() {
			vm.geocode(vm.homeForm.name, function(result) {
				vm.homeForm.latitude = result.latitude;
				vm.homeForm.longitude = result.longitude;
				$scope.$apply();
			});
		};

		vm.registerHome = function() {
			vm.home.name = vm.homeForm.name;
			vm.home.latitude = vm.homeForm.latitude;
			vm.home.longitude = vm.homeForm.longitude;
			vm.homeModalInstance.close();
		};

		/* place */

		vm.placeMap = localStorageService.get('placeMap');
		vm.placeMap = vm.placeMap || {};

		$scope.$watch(function(){
			return vm.placeMap;
		}, function () {
			localStorageService.set('placeMap', vm.placeMap);
		}, true);

		vm.deletePlace = function(id) {
			delete vm.placeMap[id];
			vm.placeModalInstance.close();
		};

		vm.recalculate = function() {
			var origin = new google.maps.LatLng(vm.home.latitude, vm.home.longitude);
			var targetList = [];
			angular.forEach(vm.placeMap, function(place){
				targetList.push(new google.maps.LatLng(place.latitude, place.longitude));
			});

			var service = new google.maps.DistanceMatrixService();
			service.getDistanceMatrix({
				origins: [origin],
				destinations: targetList,
				travelMode: google.maps.TravelMode.DRIVING,
				avoidHighways: false,
				avoidTolls: false
			}, function(response, status) {
				if (status == google.maps.DistanceMatrixStatus.OK) {
					var i=0;
					angular.forEach(vm.placeMap, function(place){
						var element = response.rows[0].elements[i];
						place.distance = element.distance.value;
						place.duration = element.duration.value;
						i++;
					});
					$scope.$apply();
				}
			});
		};

		/* map */

		vm.map = { center: { latitude: vm.home.latitude, longitude: vm.home.longitude }, zoom: 10 };

		/* placeForm */

		vm.showPlaceForm = function(id) {
			if(id == null) {
				vm.placeForm = angular.copy(vm.home);
			} else {
				vm.placeForm = angular.copy(vm.placeMap[id]);
			}

			vm.placeModalInstance = $modal.open({
				templateUrl: "placeForm",
				scope: $scope
			});

			vm.placeModalInstance.rendered.then(function(){
				if(vm.placeFormMap.control.getGMap !== void 0) {
					var gmap = vm.placeFormMap.control.getGMap();
					google.maps.event.trigger(gmap, "resize");
				}

				vm.placeFormMap.center = { latitude: vm.placeForm.latitude, longitude: vm.placeForm.longitude };
				vm.placeFormMap.marker = vm.placeForm;
			});
		};

		vm.geocodePlace = function() {
			vm.geocode(vm.placeForm.name, function(result) {
				vm.placeForm.latitude = result.latitude;
				vm.placeForm.longitude = result.longitude;
				vm.placeFormMap.center = { latitude: vm.placeForm.latitude, longitude: vm.placeForm.longitude };
				$scope.$apply();
			});
		};

		vm.createOrUpdatePlace = function() {
			var place = angular.copy(vm.placeForm);
			if(place.id == null) {
				place.id = UUIDjs.create().toString();
			}
			vm.placeMap[place.id] = place;
			vm.placeForm = {};
			vm.placeModalInstance.close();
		};

		/* placeFormMap */

		vm.placeFormMap = {};
		//vm.placeFormMap.center = { latitude: vm.home.latitude, longitude: vm.home.longitude };
		//vm.placeFormMap.marker = vm.placeForm;
		vm.placeFormMap.style = { "display": "block" };
		vm.placeFormMap.control = {};

		vm.placeFormMap.toggle = function() {
			if(vm.placeFormMap.style.display == "none") {
				vm.placeFormMap.style = { "display": "block"};
			} else {
				vm.placeFormMap.style = { "display": "none"};
			}
		};

		vm.placeFormMap.setMarker = function(maps, eventName, args) {
			vm.placeForm.latitude = args[0].latLng.lat();
			vm.placeForm.longitude = args[0].latLng.lng();
			$scope.$apply();
		};
	}
})();
