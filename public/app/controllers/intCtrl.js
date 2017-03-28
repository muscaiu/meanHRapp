'use strict'

angular.module("interviewControllers", ['md.data.table', 'mdDatetime'])

    .config(function ($mdDateLocaleProvider) {

        // Can change week display to start on Monday.
        $mdDateLocaleProvider.firstDayOfWeek = 1;
    })

    .controller("intCtrl", function (shareData, $mdToast, uploadFile, $mdSidenav, $mdDialog, Interview, $scope, $timeout, $location, $rootScope, $window, $interval) {

        var int = this
        var displayingObject = {}

        getInterviewsFiltered('All')

        $scope.sortType = 'dataapplicazione'; // set the default sort type
        $scope.sortReverse = false; // set the default sort order

        $scope.editInterview = function (id) {
            if (id) {
                Interview.getClickedInterview(id)
                    .then(function (response) {
                        int.editedObject = response.data.item
                        $mdDialog.show({
                            controller: DialogController,
                            templateUrl: 'app/views/dialogs/editInterview.html',
                            locals: {
                                editedObject: int.editedObject
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
                int.editedObject = {}
                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: 'app/views/dialogs/editInterview.html',
                    locals: {
                        editedObject: int.editedObject
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

            $scope.esitocolloqui = [
                'assunto',
                'scartato',
                'rifiuta',
                'attendo risposta',
                'da rivedere',
                'irreperibile',
                'non interessato'
            ]

            $scope.hide = function () {
                $mdDialog.hide();
            };

            $scope.cancel = function () {
                $mdDialog.cancel();
            };

            $scope.save = function (data) {
                $mdDialog.hide(data);
                //console.log(data);
            };

            //to get the edited data in input boxes
            $scope.editedObject = editedObject
            $scope.newInterview = angular.copy($scope.editedObject)

            if ($scope.newInterview.dataapplicazione) {
                $scope.newInterview.dataapplicazione = new Date($scope.newInterview.dataapplicazione)
            }
            if ($scope.newInterview.datacolloquio) {
                $scope.newInterview.datacolloquio = new Date($scope.newInterview.datacolloquio)
            }

            $scope.dataCollChanged = function (date) {
                console.log('datechaged', date)
            }

            $scope.AggiungiDataColloquio = function () {
                $scope.DataCollEnabled = true
            }

            $scope.submitInterview = function (newInterview) {
                function isEmpty(obj) {
                    return Object.keys(obj).length === 0;
                }

                if (isEmpty(editedObject)) {
                    //console.log('new interview:', newInterview, app.username)

                    console.log('new int:', newInterview)
                    console.log('new dataapp:', $scope.newInterview.dataapplicazione)
                    console.log('new datacoll:', $scope.newInterview.datacolloquio)

                    //CREATE Interview
                    Interview.create({
                        newInterview: newInterview,
                        username: shareData.loggedUser
                    }).then(function () {
                        checkDisplaying()
                        $mdDialog.hide();
                    })
                } else {
                    console.log('upd edited:', newInterview)
                    console.log('upd dataapp:', $scope.newInterview.dataapplicazione)
                    console.log('upd datacoll:', $scope.newInterview.datacolloquio)

                    let currentCV = ((!$scope.cv) ? newInterview.cv : $scope.cv);
                    let currentCI = ((!$scope.ci) ? newInterview.ci : $scope.ci);

                    // if (newInterview.dataapplicazione === null) {
                    //     delete newInterview.dataapplicazione
                    // }

                    Interview.editInterview(editedObject._id, newInterview, currentCV, currentCI)
                        .then(function (response) {
                            checkDisplaying()
                            $mdDialog.hide();
                        })
                }
                showToast('Intervista salvato con successo !')
            }

            //Upload File Code:
            $scope.file = {}
            $scope.uploadCVEnabled = true
            $scope.uploadCIEnabled = true
            // console.log('enabling buttons', $scope.uploadButtonsAreEnabled)

            $scope.SubmitUploadCV = function () {
                $scope.uploadCVEnabled = false
                // $scope.uploading = true
                console.log('enabling buttons', $scope.uploadButtonsAreEnabled)
                uploadFile.uploadCV($scope.file).then(function (data) {
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
            $scope.SubmitUploadCI = function () {
                $scope.uploadCIEnabled = false
                // $scope.uploading = true
                // console.log($scope.file.upload.name)
                uploadFile.uploadCI($scope.file).then(function (data) {
                    if (data.data.success) {
                        // $scope.uploading = false
                        $scope.alert = 'alert alert-success'
                        $scope.message = data.data.message
                        // $scope.file = {}
                        $scope.ci = data.data.ci
                    } else {
                        // $scope.uploading = false
                        $scope.alert = 'alert alert-danger'
                        $scope.message = data.data.message;
                        $scope.file = {}
                    }
                })
            }

            $scope.showConfirm = function () {
                // Appending dialog to document.body to cover sidenav in docs app
                var confirm = $mdDialog.confirm()
                    .title('Sei sicuro di voler eliminare?')
                    //.textContent('All of the banks have agreed to forgive you your debts.')
                    .ariaLabel('Danger')
                    //.targetEvent(ev)
                    .ok('No')
                    .cancel('Si');

                $mdDialog.show(confirm)
                    .then(
                    function () { //Cancel
                        console.log('Dialog Canceled')
                    },
                    function () { //Confirm
                        Interview.delete(editedObject._id)
                            .then(function (response) {
                                //console.log(response.data.success, response.data.message)
                                checkDisplaying()
                            })
                    });
            };
        }

        //Call Sort Modal
        $scope.sortModal = function () {
            $mdDialog.show({
                controller: SortDialogController,
                templateUrl: 'app/views/dialogs/sortInterviews.html',
                // locals: {
                //     editedObject: editedObject
                // },
                parent: angular.element(document.body),
                //targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
            })
        }

        //Call Chart Modal
        $scope.intChartModal = function () {
            $mdDialog.show({
                controller: ChartDialogController,
                templateUrl: 'app/views/pages/interviews/intChart.html',
                // locals: {
                //     editedObject: editedObject
                // },
                parent: angular.element(document.body),
                //targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
            })
        }

        //Controler for SortModal
        function SortDialogController($scope, $mdDialog) {
            $scope.RangeFilter = function (fromDate, toDate) {
                RangeFilter(fromDate, toDate);
                $mdDialog.hide();
            };

            $scope.getAll = function () {
                getInterviewsFiltered('All')
                $mdDialog.hide();
            };
            $scope.getAssunti = function () {
                getInterviewsFiltered('Assunti')
                $mdDialog.hide();
            };
            $scope.getDaRivedere = function () {
                getInterviewsFiltered('Da Rivedere')
                $mdDialog.hide();
            };
            $scope.getScartati = function () {
                getInterviewsFiltered('Scartati')
                $mdDialog.hide();
            };
            $scope.cancel = function () {
                $mdDialog.cancel();
            };
        }

        //Controller for Intervirews Chart
        function ChartDialogController($scope, $mdDialog) {
            $scope.barChart = {};
            $scope.barChart.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            $scope.barChart.series = ['Interviste', 'Assunti', 'Da Rivedere', 'Scartati']
            $scope.barChart.colors = ["#adabab", "#52aa25", "#43ADE9", "#ce4533"] //Interviste, Assunti, DaRivedere, Scartati

            $scope.cancel = function () {
                $mdDialog.cancel();
            };

            $scope.barChart.options = {
                responsive: false,
                maintainAspectRatio: true,
                legend: { display: true }
            }
            $scope.barChart.data = []

            //Button/OnLoad function
            $scope.loadChartData = function (option) {
                $scope.selectedChartOrder = option
                $scope.selectedYear = $scope.selectedChartOrder

                $scope.barChart.data = []

                if (option == 2017) {
                    ChartFilterYear(option)
                } else if (option == 2016) {
                    ChartFilterYear(option)
                } else {
                    console.log('chart year != 2016 or 2017')
                }
            }

            //Load 2017 on start
            $scope.selectedChartOrder = (2017)
            $scope.loadChartData($scope.selectedChartOrder)

            //Filter function used for each year
            function ChartFilterYear(option) {

                var monthInterviews = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                var monthAssunti = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                var monthDaRivedere = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                var monthScartati = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

                //Load all data from the DB
                Interview.getinterviews().then(function (response) {
                    response.data.forEach(function (element) {

                        var momentYear = moment(element.dataapplicazione).format('YYYY')

                        if (momentYear == option) {
                            var momentDate = moment(element.dataapplicazione).format('M')

                            for (var i = 0; i < monthInterviews.length; i++) {
                                if (momentDate == i + 1) {
                                    monthInterviews[i]++
                                    if (element.esitocolloquio == 'assunto') {
                                        monthAssunti[i]++
                                    } else
                                        if (element.esitocolloquio === 'da rivedere') {
                                            monthDaRivedere[i]++
                                        } else if (element.esitocolloquio === 'scartato') {
                                            monthScartati[i]++
                                        }
                                }
                            }
                        }
                    }, this);

                    $scope.barChart.data.push(monthInterviews)
                    $scope.barChart.data.push(monthAssunti)
                    $scope.barChart.data.push(monthDaRivedere)
                    $scope.barChart.data.push(monthScartati)
                })
            }

            $scope.$on('chart-destroy', function (evt, chart) {
                // console.log('destroy');
            });
            $scope.$on('chart-update', function (evt, chart) {
                console.log('update');
            });
        }

        function getInterviewsFiltered(option) {
            if (option == 'All') {

                var before = moment(Date.now())

                $scope.promise = $timeout(function () {
                    Interview.getinterviews(shareData.loggedUser)
                        .then(function (response) {
                            int.interviewsList = response.data

                            var after = moment(Date.now())

                            console.log('All interviews loaded in:', after.diff(before, 'miliseconds'), 'ms')

                            displayingObject = {
                                message: option + ' (Totale: ' + int.interviewsList.length + ' )',
                                activator: 'All'
                            }
                            $scope.displaying = displayingObject.message
                            $scope.limitOptions = [5, 10, 30, {
                                label: 'All',
                                value: function () {
                                    return int.interviewsList.length;
                                }
                            }];
                        })
                }, 200);
            } else if (option == 'Assunti') {
                FilterByStatus('assunto')
            } else if (option == 'Da Rivedere') {
                FilterByStatus('da rivedere')
            } else if (option == 'Scartati') {
                FilterByStatus('scartato')
            } else {
                console.log('something wrong on getInterviewsFiltered')
            }
        }
        //executed on filter with option
        function FilterByStatus(option) {
            var before = moment(Date.now())
            $scope.promise = $timeout(function () {
                Interview.getInterviewsByStatus(shareData.loggedUser, option)
                    .then(function (response) {
                        int.interviewsList = response.data
                        displayingObject = {
                            activator: option
                        }
                        var after = moment(Date.now())
                        console.log(option, 'interviews loaded in:', after.diff(before, 'miliseconds'), 'ms')
                    })
            }, 200)
        }

        function RangeFilter(fromDate, toDate) {
            if (fromDate == undefined || fromDate == null || toDate == undefined || toDate == null) {
                showToast('Selezionare Da - A periodo')
            } else {
                var momentFrom = moment(fromDate).format('MMM/D/YYYY')
                var momentTo = moment(toDate).format('MMM/D/YYYY')
                // console.log('momentfrom', momentFrom)
                // console.log('momentto', momentTo)

                $scope.fromDate = fromDate
                $scope.toDate = toDate

                var before = moment(Date.now())
                $scope.promise = $timeout(function () {
                    Interview.getInterviewsRangeFilter(fromDate, toDate)
                        .then(function (response) {
                            int.interviewsList = response.data
                            displayingObject = {
                                activator: 'Range'
                            }
                        }, this)
                    var after = moment(Date.now())
                    console.log('Range interviews loaded in:', after.diff(before, 'miliseconds'), 'ms')
                }, 200);
            }
        }

        //MD TABLE ///
        $scope.sort = {
            //defaults
            order: '-dataapplicazione',
            limit: '10',
            page: 1
        };

        function success(interviews) {
            $scope.interviewsList = interviews;
        }

        // $scope.promiseThReorder = function() {
        //     $scope.promise = $timeout(function() {
        //         console.log('promisse reorder')
        //     }, 500);
        // };

        $scope.refresh = function () {
            checkDisplaying()
            $scope.promise = $timeout(function () {
                console.log('refreshing data')
            }, 200);
        }

        function checkDisplaying() {
            if (displayingObject.activator == 'All') {
                getInterviewsFiltered('All')
            } else if (displayingObject.activator == 'Range') {
                RangeFilter($scope.fromDate, $scope.toDate)
            } else {
                FilterByStatus(displayingObject.activator)
            }
        }

        var showToast = function (message) {
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
        }

    });