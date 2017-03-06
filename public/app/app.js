angular.module('userApp', [
    'appRoutes',
    'userControllers',
    'userServices',
    'ngAnimate',
    'mainController',
    'authServices',
    'interviewServices',
    'fileModelDirective',
    'uploadFileService',
    'intChartControllers',
    'employeeControllers',
    'interviewControllers',
    'sharedService',
    'employeeServices'
])

.config(function($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptors')
})