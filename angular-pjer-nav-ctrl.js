(function (window, angular) {

    var m = angular.module('pjerNavCtrl', []);
    m.service('navService', NavService);
    m.controller('NavCtrl', NavCtrl);

    NavService.$inject = ['$templateRequest', '$compile', '$q'];

    function NavService($templateRequest, $compile, $q) {

        var src = this;

        src.resolvePageContent = function (pageId) {
            return $templateRequest(pageId);
        };

        src.compilePage = function (pageId, scope) {
            return src.resolvePageContent(pageId).then(function (pageContent) {
                var unlinked = angular.element('<div/>').html(pageContent);
                unlinked.addClass('nav-ctrl-page');
                var link = $compile(unlinked);
                var linked = link(scope);
                return {
                    scope: scope,
                    element: linked,
                    deferred: $q.defer()
                };
            });
        };
    }

    NavCtrl.$inject = ['$scope', '$element', '$animate', '$q', '$timeout', 'navService'];

    function NavCtrl($scope, $element, $animate, $q, $timeout, navService) {

        var ctrl = this;

        var pages = [];

        ctrl.present = function (pageId, animation, params) {
            var scope = $scope.$new();
            scope.pageParams = params;
            scope.present = ctrl.present;
            scope.push = ctrl.push;
            scope.pop = ctrl.pop;
            return navService.compilePage(pageId, scope).then(function (page) {
                page.params = params;
                var backPage = pages.length ? pages[0] : null;
                pages.unshift(page);
                if (animation) {
                    page.element.addClass(animation);
                }
                if (backPage) {
                    $animate.addClass(backPage.element, 'hidden').then(function () {
                        backPage.element.addClass('ng-hide');
                    });
                }
                return $animate.enter(page.element, $element, backPage ? backPage.element : null).then(function () {
                    return page.deferred.promise;
                });
            });
        };

        ctrl.push = function (pageId, params) {
            return ctrl.present(pageId, 'push', params);
        };

        ctrl.pop = function (value) {
            return $q(function (resolve, reject) {
                var page = pages.length ? pages[0] : null;
                if (page) {
                    pages.shift();
                    var backPage = pages.length ? pages[0] : null;
                    if (backPage) {
                        $animate.removeClass(backPage.element, 'hidden', {removeClass: 'ng-hide'});
                        backPage.scope.pageReturn = value;
                    }
                    page.deferred.resolve(value);
                    return $animate.leave(page.element).then(function () {
                        return resolve(page.deferred.promise);
                    });
                } else {
                    return reject(null);
                }
            });
        };

        var pageId = $element.attr('data-nav-ctrl-page');
        if (pageId) {
            $timeout(function () {
                ctrl.present(pageId);
            });
        }
    }

})(window, window.angular);