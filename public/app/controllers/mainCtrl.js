angular.module('mainController', ['authServices', 'userServices', 'interviewServices', 'ngMaterial', 'md.data.table'])

//config
.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('docs-dark')
})

.controller('mainCtrl', function($mdToast, uploadFile, $mdSidenav, $mdDialog, Interview, Auth, $scope, $http, $timeout, $location, $rootScope, $window, $interval, $route, User, AuthToken) { //Auth from authServices
    var app = this;

    app.loadme = false;

    app.checkSession = function() {
        if (Auth.isLoggedIn()) {
            app.checkingsession = true;

            //THIS PART WITH SOME authServices part is for token expire
            // var interval = $interval(function() {
            //     //console.log('testing if login token is expired every 10 sec');
            //     var token = $window.localStorage.getItem('token')
            //     if (token === null) {
            //         $interval.cancel(interval) //cancel checking when the token is expired
            //     } else {
            //         //converts the token time to timestamp so we can compare it to localtime
            //         //so we can determine how much time is left on the token
            //         self.parseJwt = function(token) {
            //             var base64Url = token.split('.')[1];
            //             var base64 = base64Url.replace('-', '+').replace('_', '/');
            //             return JSON.parse($window.atob(base64));
            //         }
            //         var expireTime = self.parseJwt(token);
            //         var timeStamp = Math.floor(Date.now() / 1000);
            //         //console.log(expireTime.exp);
            //         //console.log(timeStamp);
            //         var timeCheck = expireTime.exp - timeStamp;
            //         console.log('timecheck', timeCheck);
            //         if (timeCheck <= 25) {
            //             console.log('token has expired');
            //             showModal(1) //option 1 
            //             $interval.cancel(interval) //cancel checking when the token is expired
            //         } else {
            //             console.log('token not yet expired');
            //         }
            //     }
            //     //console.log(token);
            // }, 2000)
        }
    }

    app.checkSession();

    // var showModal = function(option) {
    //     app.choiceMade = false;
    //     app.modalHeader = undefined;
    //     app.modalBody = undefined;
    //     app.hideButton = false;

    //     if (option === 1) {
    //         app.modalHeader = 'Edit Interview'
    //         app.modalBody = 'editing stuff'
    //         $('#myModal').modal({ backdrop: "static" }) //can't click on background

    //     } else if (option === 2) {
    //         //logout portion
    //         // $timeout(function() {
    //         Auth.logout();
    //         $location.path('/login');
    //         $route.reload();
    //         //}, 2000);
    //     }
    // }

    // app.renewSession = function() {

    //     app.choiceMade = true;

    //     User.renewSession(app.username).then(function(data) {
    //         if (data.data.success) {
    //             AuthToken.setToken(data.data.token); //reset the token
    //             app.checkSession()
    //         } else {
    //             app.modalBody = data.data.message;
    //         }
    //     });

    //     // hideModal();
    //     console.log('session has been renewed');
    // }

    // app.endSession = function() {
    //     app.choiceMade = false;
    //     // hideModal();
    //     $timeout(function() {
    //             // showModal(2)
    //         }, 1000) //1000 timeout between popop modals
    // }

    // var hideModal = function() {
    //     $('#myModal').modal('hide');
    // }



    var displayingObject = {}

    //Load interviews from DB On Page refresh or any page load
    $scope.RunLast7Days = function() {
        Interview.getLast7Days().then(function(response) {
            app.interviewsList = response.data

            displayingObject = {
                message: 'last 7 days' + ' (Total: ' + app.interviewsList.length + ' )',
                activator: 'last7Days'
            }

            $scope.displaying = displayingObject.message
        })
    }
    $scope.RunLast7Days()

    //$rootScope.$on('$viewContentLoaded', function() {
    $rootScope.$on('$routeChangeStart', function() {

        if (!app.checkingsession) app.checkSession();

        //Auth in authservices
        if (Auth.isLoggedIn()) {
            //console.log('success, User is logged in ');

            app.isLoggedIn = true;

            Auth.getUser().then(function(data) {
                //to accest username from the front-end
                app.username = data.data.username
                app.useremail = data.data.email
                app.loadme = true;
            })
        } else {
            //console.log('failure, User is NOT logged in ');
            app.isLoggedIn = false;
            app.username = null;
            app.loadme = true;
        }
    })

    this.doLogin = function(loginData) {
        app.successMsg = false;
        app.errorMsg = false;
        app.isLoading = true;

        Auth.login(app.loginData).then(function(data) {
            //console.log(data.data.success, data.data.message);
            if (data.data.success) {
                //Create Success message
                app.successMsg = data.data.message + '...Redirecting';
                $timeout(function() {
                    //Redirect To HomePage
                    $location.path('/interviews')
                    app.isLoading = false
                    app.loginData = null;
                    app.successMsg = false;
                    app.checkSession();

                    $scope.RunLast7Days()
                }, 1000)

            } else {
                //Create error message
                app.errorMsg = data.data.message;
                $timeout(function() {
                    app.isLoading = false
                }, 1000)
            }
        })
    }

    this.logout = function() {
        // showModal(2)
        buildToggler('left')
        Auth.logout();
        $location.path('/login');
        $route.reload();
    }


    //submit new Interview
    // this.submitInterview = function(obj) {
    //     // console.log(app.newInterview);
    //     Interview.create({ newInterview: app.newInterview, username: app.username })
    // }


    //sorting defaults
    $scope.sortType = 'dataapplicazione'; // set the default sort type
    $scope.sortReverse = false; // set the default sort order

    $scope.editInterview = function(id) {
        if (id) {
            $http.get('/api/getinterview/' + id).then(function(response) {
                editedObject = response.data.item
                $mdDialog.show({
                        controller: DialogController,
                        templateUrl: 'app/views/dialogs/editInterview.html',
                        locals: {
                            editedObject: editedObject
                        },
                        parent: angular.element(document.body),
                        //targetEvent: ev,
                        clickOutsideToClose: false,
                        fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
                    })
                    // .then(function(answer) {
                    //     $scope.status = 'You said the information was "' + answer + '".';
                    // }, function() {
                    //     $scope.status = 'You cancelled the dialog.';
                    // });
            })
        } else {
            editedObject = {}
            $mdDialog.show({
                controller: DialogController,
                templateUrl: 'app/views/dialogs/editInterview.html',
                locals: {
                    editedObject: editedObject
                },
                parent: angular.element(document.body),
                //targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
            })
        }
    }

    function DialogController($scope, $mdDialog, editedObject) {
        $scope.sessi = ['M', 'F']
        $scope.hide = function() {
            $mdDialog.hide();
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.save = function(data) {
            $mdDialog.hide(data);
            console.log(data);
        };

        $scope.editedObject = editedObject
        $scope.newInterview = angular.copy($scope.editedObject)


        if ($scope.newInterview.dataapplicazione) {
            $scope.newInterview.dataapplicazione = new Date($scope.newInterview.dataapplicazione)
            console.log($scope.newInterview.dataapplicazione)
        }

        $scope.submitInterview = function(newInterview) {
            function isEmpty(obj) {
                return Object.keys(obj).length === 0;
            }

            if (isEmpty(editedObject)) {
                console.log('new interview:', newInterview, app.username)
                Interview.create({ newInterview: newInterview, username: app.username }).then(function() {
                    // Interview.getinterviews().then(function(response) {
                    //     app.interviewsList = response.data
                    // })
                    checkDisplaying()
                    $mdDialog.hide();
                })
            } else {
                console.log('editing', editedObject._id)
                console.log('sending data:', newInterview)
                $http.put('/api/editinterview/' + editedObject._id, {
                    updateData: newInterview,
                    editedBy: app.username,
                    cv: $scope.cv
                }).then(function(response) {
                    console.log('Data updated status:', newInterview)
                }).then(function(response) {
                    // Interview.getinterviews().then(function(response) {
                    //     app.interviewsList = response.data
                    //         //console.log(app.interviewsList);
                    // })
                    checkDisplaying()
                    $mdDialog.hide();
                })
            }
        }

        $scope.Browse = function() {
            $scope.browseClicked = true
        }

        //Upload File Code:
        $scope.file = {}
        $scope.SubmitUpload = function() {
            // $scope.uploading = true
            console.log($scope.file.upload.name)
            uploadFile.upload($scope.file).then(function(data) {
                if (data.data.success) {
                    // $scope.uploading = false
                    $scope.alert = 'alert alert-success'
                    $scope.message = data.data.message
                        // $scope.file = {}
                    $scope.cv = data.data.cv
                } else {
                    // $scope.uploading = false
                    $scope.alert = 'alert alert-danger'
                    $scope.message = data.data.message;
                    $scope.file = {}
                }
            })
        }

        $scope.showConfirm = function() {
            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.confirm()
                .title('Are you sure you want to delete?')
                //.textContent('All of the banks have agreed to forgive you your debts.')
                .ariaLabel('Danger')
                //.targetEvent(ev)
                .ok('Cancel')
                .cancel('Ok');

            $mdDialog.show(confirm).then(
                function() {
                    console.log('Dialog Canceled')
                },
                function() {
                    $http.delete('/api/interviews/' + editedObject._id).then(function(response) {
                        //console.log(response.data.success, response.data.message)
                        checkDisplaying()
                    })
                });
        };

    }

    //MD TABLE ///

    $scope.sort = {
        //defaults
        order: 'dataapplicazione',
        limit: '5',
        page: 1
    };

    $scope.limitOptions = [5, 10, 15, {
        label: 'All',
        value: function() {
            return app.interviewsList.length;
        }
    }];

    function success(interviews) {
        $scope.interviewsList = interviews;
    }

    $scope.promiseInterviews = function() {
        // console.log($scope.sort.order)
        //console.log($scope.selected)
        //$scope.promise = Interview.getinterviews($scope.sort, success).$promise;
    };

    $scope.loadStuff = function() {
        $scope.promise = $timeout(function() {
            console.log('loading stuff')
        }, 2000);
    }

    function checkDisplaying() {

        if (displayingObject.activator == 2016) {
            $scope.getInterviewsFiltered(2016)
            console.log('check 2016')
        } else if (displayingObject.activator == 2017) {
            console.log('check 2017')
            $scope.getInterviewsFiltered(2017)
        } else if (displayingObject.activator == 'All') {
            console.log('check All')
            Interview.getinterviews().then(function(response) {
                app.interviewsList = response.data
                displayingObject = {
                    message: option + ' (Total: ' + app.interviewsList.length + ' )',
                    activator: 'All'
                }
                $scope.displaying = displayingObject.message
            })
        } else if (displayingObject.activator == 'last7Days') {
            console.log('check last 7 days')
            $scope.RunLast7Days()
        } else if (displayingObject.activator == 'Range') {
            console.log('check Range')
            $scope.RangeFilter()
        } else {
            console.log('check unknown')
        }
    }

    $scope.getInterviewsFiltered = function(option) {
        if (option == 'All') {
            Interview.getinterviews().then(function(response) {
                app.interviewsList = response.data

                displayingObject = {
                    message: option + ' (Total: ' + app.interviewsList.length + ' )',
                    activator: 'All'
                }

                $scope.displaying = displayingObject.message
                    // showToast('Displaying ' + option + ' Total: ' + app.interviewsList.length)
            })
            console.log('Displaying', option)
        } else if (option == 2017 || option == 2016) {
            console.log('Displaying', option)
            $http.post('/api/getInterviewsFiltered', { year: option }).then(function(response) {
                app.interviewsList = response.data

                displayingObject = {
                    message: option + ' (Total: ' + app.interviewsList.length + ' )',
                    activator: option
                }

                $scope.displaying = displayingObject.message
                    // $scope.promise = $timeout(function() {
                    //     console.log('promisse')
                    // }, 2000);
                $scope.promise = app.interviewsList
                    // showToast('Displaying ' + option + ' Total: ' + app.interviewsList.length)
            }, this)
        }
    }

    $scope.RangeFilter = function() {
        if (app.fromDate == undefined || app.fromDate == null || app.toDate == undefined || app.toDate == null) {
            showToast('Select From - To Period')
        } else {
            console.log('from: ', app.fromDate)
            console.log('to', app.toDate)
            var momentFrom = moment(app.fromDate).format('MMM/D/YYYY')
            var momentTo = moment(app.toDate).format('MMM/D/YYYY')
            console.log('momentfrom', momentFrom)
            console.log('momentto', momentTo)

            $http.post('/api/getRangeFilter', { from: app.fromDate, to: app.toDate }).then(function(response) {
                app.interviewsList = response.data

                displayingObject = {
                    message: momentFrom + ' - ' + momentTo + ' (Total: ' + app.interviewsList.length + ' )',
                    activator: 'Range'
                }

                $scope.displaying = displayingObject.message
            }, this)
        }
    }

    $scope.ServerSearch = function(data) {
        console.log(data)
    }

    /////////////////////////MENU
    $scope.toggleLeft = buildToggler('left');

    function buildToggler(componentId) {
        return function() {
            $mdSidenav(componentId).toggle();
            // showToast()
        };
    }
    $scope.menu = [{
            link: '/',
            title: 'Home',
            icon: 'dashboard'
        },
        {
            link: '/interviews',
            title: 'Interviews',
            icon: 'message'
        },
        {
            link: '/employees',
            title: 'Employees',
            icon: 'message'
        },
        {
            link: '/statistics',
            title: 'Statistics',
            icon: 'message'
        }
    ];
    $scope.admin = [{
            link: '',
            title: 'Log Out',
            icon: 'delete',
        },
        {
            link: '/profile',
            title: 'Profile',
            icon: 'settings'
        }
    ];

    var showToast = function(message) {
        $mdToast.show(
            $mdToast.simple()
            .action('OK')
            .textContent(message)
            .hideDelay(2000)
            .highlightAction(true)
            .capsule(true)
            .position('top right')
            // .theme(string)
        );
        // $mdToast.show(
        //     $mdToast.simple()
        //     .textContent('Error!')
        //     .highlightAction(true)
        //     .parent(document.querySelectorAll('#toaster'))
        //     .position('bottom right')
        //     .hideDelay(3000)
        //     .action('OK')
        //     //.action('x')
        // );
    }

});




// .config(function($mdThemingProvider) {
//   $mdThemingProvider.theme('default')
//     .primaryPalette('pink')
//     .accentPalette('orange');
// });