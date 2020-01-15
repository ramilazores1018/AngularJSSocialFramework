(function () {
  'use strict';

  reconnectApp
    .directive('wcToaster', toaster)
    .controller('toasterCtrl', toasterCtrl);

  /** @ngInject */
  function toaster() {

    function link(scope, elm, attrs) {

    }

    var directive = {
      // bindToController: true,
      controller: toasterCtrl,
      controllerAs: 'toastervm',
      link: link,
      restrict: 'AE',
      scope: {
        inputDirection: '@', // Expected values: up,down,left,right where the toast should enter/exit
        inputEnterSpeed: '@', // Speed the toast should enter in milliseconds 
        inputExitSpeed: '@', // Speed the toast should exit in milliseconds
        inputText: '@',
        inputTitle: '@',
        inputType: '@',
        showToaster: '@',
        inputIcon: '@'
      },
      templateUrl: '/_layouts/15/Connect/templates/toaster/toaster.html'
      // transclude: true
    }
    return directive;
  }

  toasterCtrl.$inject = ['$scope', '$rootScope', '$timeout'];

  function toasterCtrl($scope, $rootScope, $timeout) {
    var toastervm = this;

    // METHODS
    toastervm.removeToast = removeToast;
    toastervm.toast = toast; // action to toast

    // LOCALS
    toastervm.showToaster = $scope.showToaster || false; // true/false
    toastervm.direction = $scope.inputDirection || "fromRightTop"; // direction where toaster is coming from
    toastervm.text = $scope.inputText || "";
    toastervm.title = $scope.inputTitle || "";
    toastervm.icon = $scope.inputIcon || "check-circle"; // Default font awesome icon

    /******* NOT SUPPORTED YET  **********/
    // toastervm.enterSpeed = $scope.inputEnterSpeed || ".5s"; // Slide in speed in ms
    // toastervm.exitSpeed = $scope.inputExitSpeed || "2s" // Exit speed
    

    $rootScope.$on('toast', function (event, data) {
      toast(data);
    });

    function init() {

      toastervm.initialClass = "toaster alert " // + toastervm.direction;

      toastervm.settings = {
        type: {
          success: "alert-success",
          info: "alert-info",
          warning: "alert-warning",
          fail: "alert-danger",
          wcTheme: "wc-toaster"
        },
        // Currently, The commented lines are not enabled in the CSS.
        direction: {
          // topRight: "fromTopRight",
          rightTop: "fromRightTop",
          rightCenter: "fromRightCenter",
          rightBottom: "fromRightBottom",
          // bottomRight: "fromBottomRight",
          // bottomCenter: "frombottomCenter",
          // bottomLeft: "fromBottomLeft",
          // leftBottom: "fromLeftBottom",
          // leftCenter: "fromLeftCenter",
          // leftTop: "fromLeftTop",
          // topLeft:"fromTopLeft",
          topCenter:{
              in: "fromTopCenterFadeIn",
              out: "fromTopCenterFadeOut"
            }
        }
      }
      toastervm.class = toastervm.initialClass;
      toastervm.showToaster = false;

      // var type = $scope.inputType || "wc-toaster"
      //var toasterClass = "toaster alert " + toastervm.direction + " ";

      // SETUP CLASSES BASED ON PROVIDED TYPE
      // if (type) {
      //   switch (type) {
      //     case "success":
      //       toasterClass += toastervm.settings.type.success;
      //       break;
      //     case "fail":
      //       toasterClass += toastervm.settings.type.fail;
      //       break;
      //     case "info":
      //       toasterClass += toastervm.settings.type.info;
      //       break;
      //     case "warning":
      //       toasterClass += toastervm.settings.type.warning;
      //       break;
      //     case "wc-toaster":
      //       // REMOVE BOOTSTRAP ALERTS
      //       toasterClass += toastervm.settings.type.wcTheme;
      //       break;
      //     default:
      //       break;
      //   }
      // }
      // toastervm.class = toasterClass;
    }

    function toast(options) {
      var direction;
      var type = $scope.inputType || "wc-toaster"
      // ASSIGN PASSED IN OPTIONS TO toastervm.properties
      if (options) {
        var keys = Object.keys(options);
        for (var i = 0; i < keys.length; i++) {
          if (toastervm.hasOwnProperty(keys[i])) {
            toastervm[keys[i]] = options[keys[i]];
          }
        }
      }

      if (toastervm.direction) {
        var keys = Object.keys(toastervm.settings.direction);
        for (var j = 0; j < keys.length; j++) {
          if (toastervm.direction == keys[j]) {
            direction = toastervm.settings.direction[keys[j]];
          }
        }
      }

      toastervm.class =  toastervm.initialClass + direction.in + " " + type + " show";

      $timeout(2000)
      .then(function(){
        // return $timeout(removeToast(direction,type),500);
        return $timeout(function(){
          toastervm.class = toastervm.class.replace(direction.in,direction.out);
        },500);
      })
      .then(function(){
        return $timeout(removeToast());
      })

    }

    function removeToast(direction,type) {
      // direction = direction || "";
      // type = type || "";
      toastervm.class = toastervm.initialClass //+ " " + direction.out + " " + type;
    }

    function pushNotification() {
      //show web notification when button is clicked
      document.querySelector('.some-button').addEventListener('click', function onClick() {
        webNotification.showNotification('Example Notification', {
          body: 'Notification Text...',
          icon: 'my-icon.ico',
          onClick: function onNotificationClicked() {
            // console.log('Notification clicked.');
          },
          autoClose: 4000 //auto close the notification after 4 seconds (you can manually close it via hide function)
        }, function onShow(error, hide) {
          if (error) {
            window.alert('Unable to show notification: ' + error.message);
          } else {
            // console.log('Notification Shown.');

            setTimeout(function hideNotification() {
              // console.log('Hiding notification....');
              hide(); //manually close the notification (you can skip this if you use the autoClose option)
            }, 5000);
          }
        });
      });

      //service worker example
      navigator.serviceWorker.register('service-worker.js').then(function (registration) {
        document.querySelector('.some-button').addEventListener('click', function onClick() {
          webNotification.showNotification('Example Notification', {
            serviceWorkerRegistration: registration,
            body: 'Notification Text...',
            icon: 'my-icon.ico',
            actions: [{
                action: 'Start',
                title: 'Start'
              },
              {
                action: 'Stop',
                title: 'Stop'
              }
            ],
            autoClose: 4000 //auto close the notification after 4 seconds (you can manually close it via hide function)
          }, function onShow(error, hide) {
            if (error) {
              window.alert('Unable to show notification: ' + error.message);
            } else {
              // console.log('Notification Shown.');

              setTimeout(function hideNotification() {
                // console.log('Hiding notification....');
                hide(); //manually close the notification (you can skip this if you use the autoClose option)
              }, 5000);
            }
          });
        });
      });
    }

    init();

  }

}());