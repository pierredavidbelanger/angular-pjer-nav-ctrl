(function (window, angular) {

    var m = angular.module('pjerNavCtrl', []);
    m.service('pjerNavCtrlConfig', NavCtrlConfig);
    m.controller('NavCtrl', NavCtrl);

    function NavCtrlConfig() {
        this.pageUrlResolver = function (pageId) {
            return pageId;
        };
    }

    NavCtrl.$inject = ['$scope', '$element', '$templateRequest', '$compile', '$animate', '$q', '$timeout', 'pjerNavCtrlConfig'];

    function NavCtrl($scope, $element, $templateRequest, $compile, $animate, $q, $timeout, pjerNavCtrlConfig) {

        var ctrl = this;

        var pages = [];

        var newPage = function (pageId, params) {
            var templateUrl = pjerNavCtrlConfig.pageUrlResolver(pageId);
            return $templateRequest(templateUrl).then(function (template) {
                var pageRaw = angular.element('<div/>').html(template);
                pageRaw.addClass('nav-ctrl-page');
                var pageLink = $compile(pageRaw);
                var pageScope = $scope.$new();
                pageScope.pageParams = params;
                pageScope.present = ctrl.present;
                pageScope.push = ctrl.push;
                pageScope.pop = ctrl.pop;
                var element = pageLink(pageScope);
                return {
                    scope: pageScope,
                    params: params,
                    element: element,
                    deferred: $q.defer()
                };
            });
        };

        ctrl.present = function (pageId, animation, params) {
            return newPage(pageId, params).then(function (page) {
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