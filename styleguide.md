
# White & Case Angular Style Guide

**Best Practices**
Taken from https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#single-responsibility
The information provided in this document is to help guide everyone on the steps for consistent AngularJs development.
This will help eleminate inconsistencies and bridge the readability and clean-code gap between developers.
All subjects are listed in a table of contents below. First topic covers installing an AngularJs Visual Studio Code snippet.
This is not required, but very useful for getting started with Angular.

## Table of Contents

  1. [Visual Studio Snippet to install](#Visual-Studio-Snippet-to-install)
  2. [Single Responsibility](#single-responsibility)
  3. [IIFE](#iife)
  4. [Definitions](#Definitions)
  5. [Named vs Anonymous Functions](#Named-vs-Anonymous-Functions)
  6. [Controllers](#Controllers)
        1. [controllerAs View Syntax](#controllerAs-View-Syntax)
        2. [controllerAs with vm](#controllerAs-with-vm)
        3. [controllerAs Controller Syntax](#controllerAs-Controller-Syntax)
  7. [Bindable Members Up Top](#Bindable-Members-Up-Top)
  8. [Function Declarations to Hide Implementation Details](#Function-Declarations-to-Hide-Implementation-Details)
  9. [Defer Controller Logic to Services](#Defer-Controller-Logic-to-Services)
  10. [Keep Controllers Focused](#Keep-Controllers-Focused)
  11. [Services - Singletons](#Services-Singletons)
  12. [Factory Single Responsibility](#Factory-Single-Responsibility)
  13. [Accessible Members Up Top](#Accessible-Members-Up-Top)
  14. [Separate Data Calls](#Separate-Data-Calls)
  15. [Return a Promise from Data Calls](#Return-a-Promise-from-Data-Calls)
  16. [Directives](#Directives)
  17. [Restrict to Elements and Attributes](#Restrict-to-Elements-and-Attributes)
  18. [Directives and ControllerAs](#Directives-and-ControllerAs)
  19. [Resolving Promises](#resolving-promises)
  20. [Handling Exceptions with Promises](#Handling-Exceptions-with-Promises)
  21. [Manual Annotating for Dependency Injection](#manual-annotating-for-dependency-injection)
  22. [Manually Identify Dependencies](#Manually-Identify-Dependencies)
  23. [Minification and Annotation](#minification-and-annotation)
  24. [Use Gulp or Grunt for ng-annotate](#Use-Gulp-or-Grunt-for-ng-annotate)
  25. [Exception Handling](#exception-handling)
  26. [Exception Catchers](#Exception-Catchers)
  27. [Naming](#Naming-Guidelines)
  28. [Feature File Names](#Feature-File-Names)
  29. [Controller Names](#Controller-Names)
  30. [Factory and Service Names](#Factory-and-Service-Names)

## Visual Studio Snippet to install

[Angular 1.x snippets for Visual Studio Code using John Papa AngularJS style guide](#https://marketplace.visualstudio.com/items?itemName=lperdomo.angular1-code-snippets-johnpapastyle)

**Usage**
  ngmodule  // Angular Module
  ngconfig     // Angular Config
  ngconstant   // Angular Constant
  ngcontroller // Angular Controller
  ngcontrollerscope // Angular Controller using $scope
  ngdirective  // Angular Directive
  ngfactory    // Angular Factory
  ngfilter     // Angular Filter
  ngmodule     // Angular module
  ngprovider   // Angular provider
  ngrun        // Angular Run
  ngservice    // Angular Service
  ngconfig    // Angular Config
  ngdecorator    // Angular Decorator

## Single Responsibility

**Rule of 1**
[Style Y001](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y001)
Define 1 component per file, recommended to be less than 400 lines of code.

        The same components are now separated into their own files.

```javascript
        /* recommended */

        // reconnectapp.module.js
        angular
            .module('reconnectApp', ['ngRoute']);
        /* recommended */

        // bookmarks.controller.js
        angular
            .module('reconnectApp')
            .controller('BookmarksController', BookmarksController);

        function BookmarksController() { }
        /* recommended */

        // bookmarks.factory.js
        angular
            .module('reconnectApp')
            .factory('bookmarksFactory', bookmarksFactory);

        function bookmarksFactory() { }
```

**Small Functions**
[Style Y002](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y002)
Define small functions, no more than 75 LOC (less is better).

## IIFE

JavaScript Scopes
[Style Y010](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y010)
Wrap Angular components in an Immediately Invoked Function Expression (IIFE).

```javascript
    /**
     * recommended
     *
     * no globals are left behind
     */

    // logger.js
    (function() {
        'use strict';

        angular
            .module('reconnectApp')
            .factory('logger', logger);

        function logger() { }
    })();

    // storage.js
    (function() {
        'use strict';

        angular
            .module('reconnectApp')
            .factory('storage', storage);

        function storage() { }
    })();
```

**Avoid Naming Collisions**
[Style Y020](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y020)
Use unique naming conventions with separators for sub-modules.

## Definitions

(aka Setters)
[Style Y021](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y021)
Declare modules without a variable using the setter syntax.

 ```javascript
  /* recommended */
  angular
      .module('reconnectApp', [
          'ngAnimate',
          'ngRoute',
          'reconnectApp.bookmarks',
          'reconnectApp.interactive',
          'reconnectApp.people',
          'reconnectApp.typeahead'
      ]);
 ```

## Named vs Anonymous Functions

[Style Y024](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y024)

- Use named functions instead of passing an anonymous function in as a callback.

 ```javascript
  /* recommended */

  // dashboard.js
  angular
      .module('reconnectApp')
      .controller('DashboardController', DashboardController);

  function DashboardController() { }

 ```

## Controllers

## controllerAs View Syntax

[Style [Y030](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y030)]

- Use the [`controllerAs`](http://www.johnpapa.net/do-you-like-your-angular-controllers-with-or-without-sugar/) syntax over the `classic controller with $scope` syntax.

```html
  <!-- recommended -->
  <div ng-controller="BookmarksController as bookmark">
      {{ bookmark.title }}
  </div>
```

## controllerAs Controller Syntax

[Style [Y031](#https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y031)]

- Use the `controllerAs` syntax over the `classic controller with $scope` syntax.

- The `controllerAs` syntax uses `this` inside controllers which gets bound to `$scope`

```javascript
    /* recommended - but see next section */
    function BookmarksController() {
        this.name = {};
        this.sendMessage = function() { };
    }
```

## controllerAs with vm

[Style Y032](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y032)

- Use a capture variable for this when using the controllerAs syntax. Choose a consistent variable name such as vm, which stands for ViewModel.

```javascript
    /* recommended */
    function BookmarksController() {
        var vm = this;
        vm.name = {};
        vm.sendMessage = function() { };
    }
```

## Bindable Members Up Top

[Style Y033](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y033)
Place bindable members at the top of the controller, alphabetized, and not spread through the controller code.

```javascript
  /* recommended */
  function SessionsController() {
      var vm = this;

      vm.gotoSession = gotoSession;
      vm.refresh = refresh;
      vm.search = search;
      vm.sessions = [];
      vm.title = 'Sessions';

      ////////////

      function gotoSession() {
        /* */
      }

      function refresh() {
        /* */
      }

      function search() {
        /* */
      }
  }
```

## Function Declarations to Hide Implementation Details

[Style Y034](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y034)
Use function declarations to hide implementation details. Keep your bindable members up top. When you need to bind a function in a controller, point it to a function declaration that appears later in the file. This is tied directly to the section Bindable Members Up Top. For more details see this post.

```javascript
  /**
   * recommended
   * Using function declarations
   * and accessible members up top.
   */
  function dataservice($http, $location, $q, exception, logger) {
      var isPrimed = false;
      var primePromise;

      var service = {
          saveBookmark: saveBookmark,
          saveOrder: saveOrder,
          updateBookmark: updateBookmark,
          ready: ready
      };

      return service;

      ////////////

      function saveBookmark() {
          // implementation details go here
      }

      function saveOrder() {
          // implementation details go here
      }

      function updateBookmark() {
          // implementation details go here
      }

      function prime() {
          // implementation details go here
      }

      function ready(nextPromises) {
          // implementation details go here
      }
  }
```

## Defer Controller Logic to Services

[Style Y035](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y035)
Defer logic in a controller by delegating to services and factories.

 ```javascript
  /* recommended */
  function BookmarksController(creditService) {
      var vm = this;
      vm.checkBookmarks = checkBookmarks;
      vm.isBookmarkOk;
      vm.total = 0;

      function checkBookmarks() {
         return creditService.isOrderTotalOk(vm.total)
            .then(function(isOk) { vm.isBookmarkOk = isOk; })
            .catch(showError);
      };
  }
```

## Keep Controllers Focused

[Style Y037](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y037)
Define a controller for a view, and try not to reuse the controller for other views. Instead, move reusable logic to factories and keep the controller simple and focused on its view.

## Services Singletons

[Style Y040](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y040)
Services are instantiated with the new keyword, use this for public methods and variables. Since these are so similar to factories, use a factory instead for consistency.

```javascript
  // factory
  angular
      .module('reconnectApp')
      .factory('logger', logger);

  function logger() {
      return {
          logError: function(msg) {
            /* */
          }
     };
  }
```

## Factory Single Responsibility

[Style Y050](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y050)
Factories should have a single responsibility, that is encapsulated by its context. Once a factory begins to exceed that singular purpose, a new factory should be created.

### Singletons

- Factories are singletons and return an object that contains the members of the service.
    Note: [All Angular services are singletons](https://docs.angularjs.org/guide/services).

## Accessible Members Up Top

[Style Y052](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y052)
Expose the callable members of the service (its interface) at the top, using a technique derived from the Revealing Module Pattern.

```javascript
  /* recommended */
  function dataService() {
      var someValue = '';
      var service = {
          save: save,
          someValue: someValue,
          validate: validate
      };
      return service;

      ////////////

      function save() {
          /* */
      };

      function validate() {
          /* */
      };
  }
 ```

## Separate Data Calls

[Style Y060](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y060)
Refactor logic for making data operations and interacting with data to a factory. Make data services responsible for XHR calls, local storage, stashing in memory, or any other data operations.

```javascript
  /* recommended */

  // dataservice factory
  angular
      .module('reconnectApp.core')
      .factory('dataservice', dataservice);

  dataservice.$inject = ['$http', 'logger'];

  function dataservice($http, logger) {
      return {
          getBookmarks: getBookmarks
      };

      function getBookmarks() {
          return $http.get('/api/maa')
              .then(getBookmarksComplete)
              .catch(getBookmarksFailed);

          function getBookmarksComplete(response) {
              return response.data.results;
          }

          function getBookmarksFailed(error) {
              logger.error('XHR Failed for getBookmarks.' + error.data);
          }
      }
  }
```

    Note: The data service is called from consumers, such as a controller, hiding the implementation from the consumers,

## Return a Promise from Data Calls

[Style Y061](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y061)
When calling a data service that returns a promise such as $http, return a promise in your calling function too.

```javascript
  /* recommended */

  init();
  var vm = this;
  function init() {
      /**
       * Step 1
       * Ask the getBookmarks function for the
       * bookmarks data and wait for the promise
       */
      return getBookmarks().then(function() {
          /**
           * Step 4
           * Perform an action on resolve of final promise
           */
          logger.info('Activated Bookmarks View');
      });
  }

  function getBookmarks() {
        /**
         * Step 2
         * Ask the data service for the data and wait
         * for the promise
         */
        return dataservice.getBookmarks()
            .then(function(data) {
                /**
                 * Step 3
                 * set the data and resolve the promise
                 */
                vm.bookmarks = data;
                return vm.bookmarks;
        });
  }
 ```

## Directives

### Limit 1 Per File

[Style Y070](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y070)
Create one directive per file. Name the file for the directive.

```javascript
  /* recommended */
  /* calendar-range.directive.js */

  /**
   * @desc order directive that is specific to the order module at a company named Acme
   * @example <div acme-order-calendar-range></div>
   */
  angular
      .module('sales.order')
      .directive('acmeOrderCalendarRange', orderCalendarRange);

  function orderCalendarRange() {
      /* implementation details */
  }
  ```

  ```javascript
  /* recommended */
  /* customer-info.directive.js */

  /**
   * @desc sales directive that can be used anywhere across the sales app at a company named Acme
   * @example <div acme-sales-customer-info></div>
   */
  angular
      .module('sales.widgets')
      .directive('acmeSalesCustomerInfo', salesCustomerInfo);

  function salesCustomerInfo() {
      /* implementation details */
  }
  ```

  ```javascript
  /* recommended */
  /* spinner.directive.js */

  /**
   * @desc spinner directive that can be used anywhere across apps at a company named Acme
   * @example <div acme-shared-spinner></div>
   */
  angular
      .module('shared.widgets')
      .directive('acmeSharedSpinner', sharedSpinner);

  function sharedSpinner() {
      /* implementation details */
  }
  ```

### Manipulate DOM in a Directive

[Style Y072](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y072)

- When manipulating the DOM directly, use a directive. If alternative ways can be used such as using CSS to set styles or the [animation services](https://docs.angularjs.org/api/ngAnimate), Angular templating, [`ngShow`](https://docs.angularjs.org/api/ng/directive/ngShow) or [`ngHide`](https://docs.angularjs.org/api/ng/directive/ngHide), then use those instead. For example, if the directive simply hides and shows, use ngHide/ngShow.****

## Restrict to Elements and Attributes

[Style Y074](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y074)
When creating a directive that makes sense as a stand-alone element, allow restrict E (custom element) and optionally restrict A (custom attribute). Generally, if it could be its own control, E is appropriate. General guideline is allow EA but lean towards implementing as an element when it's stand-alone and as an attribute when it enhances its existing DOM element.

  ```html
  <!-- recommended -->
  <my-bookmarks-range></my-bookmarks-range>
  <div my-bookmarks-range></div>
  ```

  ```javascript
  /* recommended */
  angular
      .module('reconnectApp.widgets')
      .directive('myBookmarks', myBookmarks);

  function myBookmarks() {
      var directive = {
          link: link,
          templateUrl: '/template/is/located/myBookmarks.html',
          restrict: 'EA'
      };
      return directive;

      function link(scope, element, attrs) {
        /* */
      }
  }
  ```

## Directives and ControllerAs

[Style Y075](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y075)
Use controllerAs syntax with a directive to be consistent with using controller as with view and controller pairings.
Note: You can also name the controller when you inject it into the link function and access directive attributes as properties of the controller.

 ```javascript
  angular
      .module('reconnectApp')
      .directive('BookmarksDirective', BookmarksDirective);

  function BookmarksDirective() {
      var directive = {
          restrict: 'EA',
          templateUrl: 'app/feature/Bookmarks.directive.html',
          scope: {
              max: '='
          },
          link: linkFunc,
          controller: BookmarksController,
          // note: This would be 'BookmarksController' (the exported controller name, as string)
          // if referring to a defined controller in its separate file.
          controllerAs: 'vm',
          bindToController: true // because the scope is isolated
      };

      return directive;

      function linkFunc(scope, el, attr, ctrl) {
          console.log('LINK: scope.min = %s *** should be undefined', scope.min);
          console.log('LINK: scope.max = %s *** should be undefined', scope.max);
          console.log('LINK: scope.vm.min = %s', scope.vm.min);
          console.log('LINK: scope.vm.max = %s', scope.vm.max);
      }
  }

  BookmarksController.$inject = ['$scope'];

  function BookmarksController($scope) {
      // Injecting $scope just for comparison
      var vm = this;
      vm.min = 3;
      vm.$onInit = onInit;

      console.log('CTRL: $scope.vm.min = %s', $scope.vm.min);
      console.log('CTRL: $scope.vm.max = %s', $scope.vm.max); // undefined in Angular 1.5+
      console.log('CTRL: vm.min = %s', vm.min);
      console.log('CTRL: vm.max = %s', vm.max); // undefined in Angular 1.5+

      // Angular 1.5+ does not bind attributes until calling $onInit();
      function onInit() {
          console.log('CTRL-onInit: $scope.vm.min = %s', $scope.vm.min);
          console.log('CTRL-onInit: $scope.vm.max = %s', $scope.vm.max);
          console.log('CTRL-onInit: vm.min = %s', vm.min);
          console.log('CTRL-onInit: vm.max = %s', vm.max);
      }
  }
  ```

  ```html
    <!-- example.directive.html -->
    <div>hello world</div>
    <div>max={{vm.max}}<input ng-model="vm.max"/></div>
    <div>min={{vm.min}}<input ng-model="vm.min"/></div>
  ```

[Style Y076](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y076)
Use bindToController = true when using controller as syntax with a directive when you want to bind the outer scope to the directive's controller's scope.

## Resolving Promises

Controller Activation Promises
[Style Y080](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y080)
Resolve start-up logic for a controller in an activate function.

   ```javascript
    /* recommended */
    function BookmarksController(dataservice) {
        var vm = this;
        vm.bookmarks = [];
        vm.title = 'Bookmarks';

        init();

        ////////////

        function init() {
            return dataservice.getBookmarks().then(function(data) {
                vm.bookmarks = data;
                return vm.bookmarks;
            });
        }
    }
```

## Handling Exceptions with Promises

[Style Y082](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y082)
The catch block of a promise must return a rejected promise to maintain the exception in the promise chain.
Always handle exceptions in services/factories.
Note: Consider putting any exception handling in a function in a shared module and service.

  ```javascript
  /* recommended */
  function getBookmarks(id) {
      return $http.get('/api/bookmarks/' + id)
          .then(getBookmarksComplete)
          .catch(getBookmarksFailed);

      function getBookmarksComplete(data, status, headers, config) {
          return data.data;
      }

      function getBookmarksFailed(e) {
          var newMessage = 'XHR Failed for getBookmarks'
          if (e.data && e.data.description) {
            newMessage = newMessage + '\n' + e.data.description;
          }
          e.data.description = newMessage;
          logger.error(newMessage);
          return $q.reject(e);
      }
  }
  ```

## Manual Annotating for Dependency Injection

UnSafe from Minification
[Style Y090](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y090)
Avoid using the shortcut syntax of declaring dependencies without using a minification-safe approach. Use clear and consicse names. The minification process will take care of renaming.

## Manually Identify Dependencies

[Style Y091](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y091)
Use $inject to manually identify your dependencies for Angular components.

 ```javascript
    /* recommended */
    angular
        .module('app')
        .controller('BookmarksController', BookmarksController);

    BookmarksController.$inject = ['$location', '$routeParams', 'common', 'dataservice'];

    function BookmarksController($location, $routeParams, common, dataservice) {
    }

    // Note: When your function is below a return statement the `$inject` may be unreachable (this may happen in a directive). You can solve this by moving the Controller outside of the directive.

    /* recommended */
    // outside a directive definition
    function outer() {
        var ddo = {
            controller: DashboardPanelController,
            controllerAs: 'vm'
        };
        return ddo;
    }

    DashboardPanelController.$inject = ['logger'];
    function DashboardPanelController(logger) { }
```

## Minification and Annotation

ng-annotate
[Style Y100](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y100)
Use ng-annotate for Gulp or Grunt and comment functions that need automated dependency injection using /* @ngInject */

## Use Gulp or Grunt for ng-annotate

[Style Y101](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y101)
Use gulp-ng-annotate or grunt-ng-annotate in an automated build task. Inject /* @ngInject */ prior to any function that has dependencies.

```javascript
    gulp.task('js', ['jshint'], function() {
        var source = pkg.paths.js;

        return gulp.src(source)
            .pipe(sourcemaps.init())
            .pipe(concat('all.min.js', {newLine: ';'}))
            // Annotate before uglify so the code get's min'd properly.
            .pipe(ngAnnotate({
                // true helps add where @ngInject is not used. It infers.
                // Doesn't work with resolve, so we must be explicit there
                add: true
            }))
            .pipe(bytediff.start())
            .pipe(uglify({mangle: true}))
            .pipe(bytediff.stop())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(pkg.paths.dev));
    });
```

## Exception Handling

decorators
[Style Y110](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y110)
Use a decorator, at config time using the $provide service, on the $exceptionHandler service to perform custom actions when exceptions occur.

 ```javascript
    /* recommended */
    angular
        .module('reconnectApp.exception')
        .config(exceptionConfig);

    exceptionConfig.$inject = ['$provide'];

    function exceptionConfig($provide) {
        $provide.decorator('$exceptionHandler', extendExceptionHandler);
    }

    extendExceptionHandler.$inject = ['$delegate', 'toastr'];

    function extendExceptionHandler($delegate, toastr) {
        return function(exception, cause) {
            $delegate(exception, cause);
            var errorData = {
                exception: exception,
                cause: cause
            };
            /**
             * Could add the error to a service's collection,
             * add errors to $rootScope, log errors to remote web server,
             * or log locally. Or throw hard. It is entirely up to you.
             * throw exception;
             */
            toastr.error(exception.msg, errorData);
        };
    }
```

## Exception Catchers

[Style Y111](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y111)
Create a factory that exposes an interface to catch and gracefully handle exceptions.

```javascript
    /* recommended */
    angular
        .module('blocks.exception')
        .factory('exception', exception);

    exception.$inject = ['logger'];

    function exception(logger) {
        var service = {
            catcher: catcher
        };
        return service;

        function catcher(message) {
            return function(reason) {
                logger.error(message, reason);
            };
        }
    }
```

## Naming Guidelines

[Style Y120](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y120)
Use consistent names for all components following a pattern that describes the component's feature then (optionally) its type. My recommended pattern is feature.type.js. There are 2 names for most assets:

the file name (avengers.controller.js)
the registered component name with Angular (AvengersController)

## Feature File Names

[Style Y121](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y121)
Use consistent names for all components following a pattern that describes the component's feature then (optionally) its type. My recommended pattern is feature.type.js.

```javascript
    /**
     * recommended
     */

    // controllers
    bookmarks.controller.js
    bookmarks.controller.spec.js

    // services/factories
    logger.service.js
    logger.service.spec.js

    // constants
    constants.js

    // module definition
    reconnectapp.module.js

    // routes
    reconnectapp.routes.js
    reconnectapp.routes.spec.js

    // configuration
    reconnectapp.config.js

    // directives
    reconnectapp-interactive.directive.js
    reconnectapp-interactive.directive.spec.js
```

## Controller Names

[Style Y123](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y123)
Use consistent names for all controllers named after their feature. Use UpperCamelCase for controllers, as they are constructors.

```javascript
    /**
     * recommended
     */

    // bookmarks.controller.js
    angular
        .module
        .controller('BookmarksController', BookmarksController);

    function BookmarksController() { }
```

## Factory and Service Names

[Style Y125](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#style-y125)
Use consistent names for all factories and services named after their feature. Use camel-casing for services and factories. Avoid prefixing factories and services with $. Only suffix service and factories with Service when it is not clear what they are (i.e. when they are nouns).

```javascript
    /**
     * recommended
     */

    // bookmarks.service.js
    angular
        .module
        .factory('bookmarks', bookmarks);

    function bookmarks() { }
```

```javascript
    /**
     * recommended
     */

    // credit.service.js
    angular
        .module
        .factory('anotherService', anotherService);

    function anotherService() { Some function code that does stuff... }
```

   **[Back to top](#table-of-contents)**
