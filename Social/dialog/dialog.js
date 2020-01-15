(function () {
  'use strict';

  reconnectApp
    .directive('wcDialog', wcDialog);

  function wcDialog() {

    var directive = {
      link: link,
      templateUrl: '/_layouts/15/Connect/templates/Dialog/dialog.html',
      scope: {
        dialogTitle: '@',
        dialogBody: '@',
        showButtons: '@'
      },
      controller: wcDialogCtrl,
      controllerAs: 'dialogvm'
    };

    function link(scope, elm, attrs) {

    }
    return directive;
  }
  wcDialogCtrl.$inject = ['$scope','$sce'];

  function wcDialogCtrl($scope,$sce) {
    var dialogvm = this;
    var wcModal = angular.element('#wcModal');
    /**************
     *    METHODS
     ****************/
    dialogvm.ok = ok;
    dialogvm.cancel = cancel;

    /****************
     *  PROPERTIES
     ****************/
    dialogvm.title;
    dialogvm.body;
    dialogvm.cancelBtn;
    dialogvm.okBtn;

    function init() {
      dialogvm.showButtons = $scope.showButtons || false;
      dialogvm.title = $scope.dialogTitle;
      dialogvm.body = $sce.trustAsHtml($scope.dialogBody);
      dialogvm.cancelBtn = false;
      dialogvm.okBtn = false;
    }

    function ok() {
      dialogvm.okBtn = true;
      wcModal.modal('hide');
    }

    function cancel() {
      dialogvm.cancelBtn = true;
      wcModal.modal('hide');
    }

    init();
  }
})();