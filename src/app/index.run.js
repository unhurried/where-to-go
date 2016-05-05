(function() {
  'use strict';

  angular
    .module('whereToGo')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
