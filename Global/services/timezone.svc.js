(function () {
    'use strict';

    ExecuteOrDelayUntilScriptLoaded(function () {
        var scriptbase = _spPageContextInfo.siteAbsoluteUrl + "/_layouts/15/";
        $.getScript(scriptbase + "SP.RequestExecutor.js", function () { });
    }, "sp.js");

    reconnectApp
        .factory('timezone', TimezoneSvc);

    TimezoneSvc.$inject = ['socialDataSvc', 'go'];

    function TimezoneSvc(socialDataSvc, go) {
        var currentUser = {};

        var service = {
            convertToUsersTimezone: convertToUsersTimezone, // getDateObjAdjustedForTimezone
            getFormattedDateTime: getFormattedDateTime
        };

        init();

        return service;

        // *  ====================================

        /* 
        If its a fresh date, new date, should use moment's default.
        If we are displaying a date that was pulled from Handshake, we need to add +2 to the offset
        */

        /**
         *  getFormattedDateTime()
         *  Used as a central function for handling datetime.
         *  Function uses moment, timezone, and factors +2hours 
         * @param {string} date  date as a string, typically.
         *                  Default is current date as moment.
         * @param {boolean} noFromNow noFromNow is used to indicate if you want the function to calculate and show time from now in seconds, minutes, or hours.
         *                  Default is true to skip this.
         * @param {string} format format to return date string as
         *                  Default is what moment passes back using moment.format();
         * @param {number} offset offset is an explicit offset to add or subtract in hours
         *                  By default this is not used.
         * @returns Returns date as string
         */
        function getFormattedDateTime(date, noFromNow, format, offset) {
            format = format || "";
            noFromNow = noFromNow == false ? false : true;

            /**
             * As per testing task 781, FA instructed to override the threshold values set by Moment.js
             * The set of overrides below aims to address this.
             * Reference: http://momentjs.com/docs/#/customization/relative-time-threshold/ 
             */
            moment.relativeTimeThreshold('ss', 59); //59 seconds is still seconds
            moment.relativeTimeThreshold('s', 60);  //60 seconds is 1 minute
            moment.relativeTimeThreshold('m', 60);  //60 minutes is 1 hour
            moment.relativeTimeThreshold('h', 24);  //24 hours is 1 day
            moment.relativeTimeThreshold('d', 30);  //30 days is 1 month
            moment.relativeTimeThreshold('M', 12);  //12 months is 1 year

            /**
             * Updated requirements based from User Story 186:
             *    Posts less than or equal to 30 days should return X <hours, days, months> ago (Ex. 24 days ago)
             *    Posts greater than 30 days should show absolute date
             */
            var totalDays = 30;

            var today = moment();
            var currentTZ = moment.tz.guess();

            if (typeof date == "string" && date != "") {
                var newDate = convertToUsersTimezone(date);
                if (today.diff(newDate.moment.format(), 'days') <= totalDays && !noFromNow) {
                    date = newDate.moment.fromNow();
                } else {
                    date = newDate.moment.tz(currentTZ).format(format);
                }
                return date;
            } else {
                date = moment().format();
                var newDate = convertToUsersTimezone(date);
                if (today.diff(newDate.moment.format(), 'days') < totalDays && !noFromNow) {
                    date = newDate.moment.fromNow();
                } else {
                    if (offset) {
                        date = (offset < 0) ? newDate.moment.subtract(offset, "hours").tz(currentTZ).format(format) : newDate.moment.add(offset, "hours").tz(currentTZ).format(format);
                    } else {
                        date = newDate.moment.tz(currentTZ).format(format);
                    }

                }
                return date;
            }
        }

        function convertToUsersTimezone(date) {

            if (!date) return;

            var momentObj;

            try {
                var region = moment.tz.guess();
                momentObj = moment.tz(moment(date).format(), region);
            } catch (err) {
                go.handleError(err);
                return false;
            }

            // Build out Date Object
            return buildDateObject(momentObj);

        }

        function buildDateObject(momentObj) {
            return {
                moment: momentObj,
                locale: momentObj.format('MMM DD YYYY h:mma'),
                localeDate: momentObj.format("MMM DD YYYY"),
                localTime: momentObj.format("h:mma"),
                utc: momentObj.utc(),
                utcOffset: momentObj.format('ZZ'),
            };
        }

        function init() {
            // GET AND SET USERS TIMEZONE AND OFFICE
            socialDataSvc
                .getUserOfficeTimezone(_spPageContextInfo.userId)
                .then(function (res) {
                    currentUser = res;
                });

        }

    }

}());