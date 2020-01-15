(function () {
    'use strict';

    reconnectApp
        .factory("pplSvc", pplSvc);

    pplSvc.$inject = ["go", "$q", "searchSvc", "common"];

    function pplSvc(go, $q, searchSvc, common) {
        var allUsers;
        var hsUrl = go.hsUrl;

        var service = {
            getUserByLogin: getUserByLogin,
            getUserByName: getUserByName,
            getCurrentUser: getCurrentUser,
            getUserById: getUserById,
            getUserByEmployeeId: getUserByEmployeeId,
            getAllUsers: getAllUsers,
            getPeopleBySearch: getPeopleBySearch,
            getPersonFullDetails: getPersonFullDetails,
            getWCUSerPerson: getWCUSerPerson,
            getReportsOfEmployee: getReportsOfEmployee,
            findPeople: findPeople,
            formatHSUserAsPerson: formatHSUserAsPerson,
            formatWCUserResult: formatWCUserResult,
            formatOfficeLocation: formatOfficeLocation,
            personDetailsRowToJson: personDetailsRowToJson,
            searchPeopleDirectory: searchPeopleDirectory,
            searchPeopleDirectoryCustomFilter: searchPeopleDirectoryCustomFilter,
            setSessionId: setSessionId
        };

        var decisivSessionId = '';

        init();

        return service;

        // ==========================================

        function getAllUsers(force) {

            if (getLocal('WCUsers-Active') && !force) {
                return $q.resolve(getLocal("WCUsers-Active"));
            }

            var $select = '$select=firstname,lastname,name,office,sharepointid,photo,timekeeperid,email_address,networklogin,employeeid';
            var url = "WCUsers?hsf=@job_status=active AND sharepointid <> ''&" + $select;

            return go
                .getHS(url)
                .then(function (res) {
                    // TODO: SHOULD WE SAVE TO LOCAL ?
                    //  saveLocal('WCUsers-Active', results, 48);
                    return res.data.d.results;
                });
        }

        function personDetailsRowToJson(resultRow) {

            //Create empty person
            var person = {
                "email": "", //email
                "fullName": "", //name
                "firstName": "", //name[0]
                "id": "", //id
                "peopleId": "", //peopleId
                "peopleIdEmployee": "", //peopleIdEmployee
                "timekeeperNumber": "", //timekeeperNumber
                "image": "http://placehold.it/300", //peoplePhotoSmall or peoplePhotoLarge
                "lastName": "", //name[1]
                "officeCity": "", //location.office
                "officePhone": "", //contactInformation.telephone
                "officeState": "", //location.region
                "practiceArea": "", //regional.regionalSection
                "practiceAreaSubsection": "", //regional.subsection
                "roomNumber": "", //location.room
                "shortDialPhone": "", //contactInformation.shortDial
                "title": "", //title
                /* Person Full Details */
                "barAdmission": "", //barAdmission
                "bioUrl": "", //bioURL
                //"citizenship": "", //citizenship[]
                "fax": "", //contactInformation2.fax
                "firmMobile": "", //contactInformation2.firmMobile
                "personalMobile": "", //contactInformation2.personalMobile
                "contacts": "", //contacts
                "department": "", //department
                "documents": {}, //documents (transform)
                "education": [], //education[]
                "homeAddress1": "", //homeAddress.peopleHomeAddress1
                "homeAddress2": "", //homeAddress.peopleHomeAddress2
                "homeAddress3": "", //homeAddress.peopleHomeAddress3
                "homeCityStateZip": "", //homeAddress.peopleHomeCitystatezip
                "homeCountry": "", //homeAddress.peopleHomeCountry
                "homeFax": "", //homeFax
                "homePhone": "", //homeTelephone
                "homeMobile1": "", //home cellphone
                "homeMobile2": "", //home cellphone alternate
                "matters": [], //matters.timeNote (transform)
                "partnerPractice": "", //partnerPractice[]
                "bio": "", //peopleBio
                "status": "", //peopleStatus.status
                "dateHired": "", //peopleStatus.dateHired
                "secretaries": "", //secretary
                "languages": "", //spokenLanguage[],
                "memberships": "", //spokenLanguage[],
                "Regional_Section": "", //spokenLanguage[],
                "Subsection": "" //spokenLanguage[]
            };

            // Added Handshake fields
            //Full name
            if ((resultRow.name) && (resultRow.name.length > 0)) {
                person.fullName = resultRow.name;
                person.firstName = resultRow.firstname;
                person.lastName = resultRow.lastname;
            } else {
                person.firstName = '_';
                person.lastName = '_';
            }

            person.Regional_Section = resultRow.regionalsection;
            person.Subsection = resultRow.subsection;

            //Email
            person.email = resultRow.email;

            //ID
            person.id = resultRow.networklogin;

            //People ID
            person.peopleId = resultRow.timekeeperid;

            //People ID Employee
            person.peopleIdEmployee = resultRow.employeeid;

            //Timekeeper Number
            person.timekeeperNumber = resultRow.timekeeperid;

            //Memberships
            if (resultRow.memberships) {
                person.memberships = resultRow.memberships.split('|');
            }
            

            //Image - Note: use placeholder for now because the real image path is not accessible
            person.image = resultRow.photo;

            //Location section
            person.officeCity = resultRow.office;

            //Office State
            person.officeState = resultRow.region;

            //Room Number
            person.roomNumber = resultRow.room;

            //Office, Room, Floor
            var floor = resultRow.floor;
            person.officeRoom = formatOfficeRoomFloor(resultRow.office, resultRow.room, resultRow.floor);

            //Practice Area
            person.practiceArea = resultRow.regionalsection;
            person.practiceAreaSubsection = resultRow.subsection || "";

            //Office Phone
            person.officePhone = resultRow.phonenumber;

            //Short Dial Phone
            person.shortDialPhone = resultRow.shortdial;

            //Title
            person.title = resultRow.jobtitle;

            /* Person Full Details */

            //Bar admission
            if (resultRow.bars) {
                //person.barAdmissions = resultRow.bars.split('#');
                //resultRow.bars = common.replaceAll(resultRow.bars, '#', '');
                person.barAdmissions = resultRow.bars.split('|');
            }

            //Bio URL
            if (resultRow.bio) {
                person.bioUrl = resultRow.publicurl;
                person.bio = resultRow.bio;
                //person.citizenship = resultRow.Bios[0].Citizenship;
                person.fax = resultRow.officefax;
            } else {
                person.bioUrl = "";
                person.bio = "";                
                person.fax = "";
            }

            //Extended contact info
            //Firm mobile
            if (resultRow.firmmobile) {
                person.firmMobile = resultRow.firmmobile;
            }            

            //Personal mobile
            if (resultRow.homemobilenumber1) {
                person.homeMobile1 = resultRow.homemobilenumber1;
            }            

            //Personal mobile alternate            
            if (resultRow.homemobilenumber2) {
                person.homeMobile2 = resultRow.homemobilenumber2;
            }            

            //TODO: Contacts
            //(no example in data)

            if (resultRow.displaydepartment) {
                person.department = resultRow.displaydepartment;
            }            
            /*
          !!!!!!!IGNORE get from Decisiv!!!!!!
          //Documents
          if (resultRow.documents && resultRow.documents.document) {
            person.documents = spSvc.docResultsToJson(resultRow.documents.document);
          }
          */
            //Education
            if (resultRow.education) {                
                person.education = resultRow.education.split('|');
            }            

            //Home address            
            if (resultRow.homeaddress1) {
                person.homeAddress1 = resultRow.homeaddress1;
            }
            if (resultRow.homeaddress2) {
                person.homeAddress2 = resultRow.homeaddress2;
            }
            if (resultRow.homeaddress3) {
                person.homeAddress3 = resultRow.homeaddress3;
            }
            if (resultRow.homecitystatezip) {
                person.homeCityStateZip = resultRow.homecitystatezip;
            }
            if (resultRow.country) {
                person.homeCountry = resultRow.country;
            }            

            //Home fax
            if (resultRow.homefax) {
                person.homeFax = resultRow.homefax;
            }            

            //Home phone
            if (resultRow.homephone) {
                person.homePhone = resultRow.homephone;
            }

            /*
          //Matters (extract from time notes)
          if (resultRow.matters && resultRow.matters.timeNote && resultRow.matters.timeNote.length > 0) {
            var matters = [];
            for (var i = 0; i < resultRow.matters.timeNote.length; i++) {
              var clientMatterId = resultRow.matters.timeNote[i].timeNoteClientMatterId;
              if (i == 0 || !_.findWhere(matters, { matterId: clientMatterId })) {
                matters.push({
                  matterId: clientMatterId,
                  matterName: resultRow.matters.timeNote[i].timeNoteClientMatterName
                });
              }
            }
            person.matters = matters;
          }
      
          //Partner practice
          if (resultRow.partnerPractice && resultRow.partnerPractice) {
            if (spSvc.isArray(resultRow.partnerPractice)) {
              person.partnerPractice = resultRow.partnerPractice.join(', ');
            } else {
              person.partnerPractice = resultRow.partnerPractice;
            }
          }
          */

            //Status
            if (resultRow.jobstatus) {
                person.status = resultRow.jobstatus;
            }
            //Date hired
            if (resultRow.dateHiredUtc && resultRow.dateHiredUtc.length > 0) {
                person.dateHired = resultRow.dateHiredUtc;
            } else if (resultRow.datehired && resultRow.datehired.length > 0) {
                person.dateHired = resultRow.datehired;
            }

            //Secretary
            if (resultRow.secs) {
                person.secretaries = [];
                if (resultRow.secs.indexOf(',') >= 0) {
                    person.secretaries = resultRow.secs;
                } else {
                    person.secretaries.push(resultRow.secs);
                }
                //person.secretaries = resultRow.secs.split(',');
            }

            //Languages
            if (resultRow.langs) {
                //resultRow.langs = common.replaceAll(resultRow.langs, '#', '');
                person.languages = resultRow.langs.split('|');
            }
            
            return person;
        };

        function getPersonFullDetails(id) {
            // return $q(function (resolve, reject) {
            //   function success(x) {
            //     try {
            //       var d = personDetailsRowToJson(common.fixJson(x));
            //       resolve(d);
            //     } catch (e) {
            //       // $log.error(e);
            //       reject(e);
            //     }
            //   }

            //   function err(e) {
            //     // $log.error('Error', e);
            //     reject(e);
            //   }

            var q = "hsf=@timekeeperid=" + id;

            return go
                .getHS("WCPeopleSvc?" + q)
                .then(function (res) {
                    var results = res.data.d.results[0];
                    var d = personDetailsRowToJson(results);
                    return d;
                    // saveLocal('WC-CurrentUser', results, 48);
                });

            //   return $.ajax(directorySvcBaseUrl + "GetPersonDetailsByTimeKeeperId/" + id, {
            //     type: "GET",
            //     contentType: "text/plain",
            //     crossDomain: true,
            //     dataType: 'text'
            //   }).done(success).fail(err);
            //});
        };

        function setSessionId() {
            var sessionId = common.getCookie("DecisivSessionId");
            if (sessionId != "") {
                decisivSessionId = sessionId;
            } else {
                searchSvc.getDecisivSession().then(success, err);
            }
            function success(sessionId) {
                if (sessionId != null && sessionId != "") {
                    common.setCookie("DecisivSessionId", sessionId, 45);
                    decisivSessionId = sessionId;
                }
            }

            function err(e) {
                // $log.error(e);
            }
        }

        function getUserById(spID, fields) {
            var q = "hsf=@sharepointid=" + spID;

            if (allUsers && !fields) {
                for (var i = 0; i < allUsers.length; i++) {
                    if (allUsers[i].sharepointid == spID) {
                        return $q.resolve(allUsers[i]);
                    }
                }
            }

            if (fields) {
                q += "&$select=" + fields;
            }

            return go
                .getHS("WCPeopleSvc?" + q)
                .then(function (res) {
                    var results = res.data.d.results[0];
                    return results;
                    // saveLocal('WC-CurrentUser', results, 48);   
                });
        }

        function getUserByEmployeeId(employeeId, fields) {
            var q = "hsf=@employeeid=" + employeeId;
            if (fields) {
                q += "&$select" + fields;
            }
            var deferred = $q.defer();
            go.getHS("WCPeopleSvc?" + q)
                .then(function (res) {
                    var results = res.data.d.results[0];
                    // saveLocal('WC-CurrentUser', results, 48);
                    deferred.resolve(results);
                });
            return deferred.promise;
        }

        function getWCUSerPerson(timekeeperId) {
            var q = "hsf=@timekeeperId=" + timekeeperId;            
            var deferred = $q.defer();
            go.getHS("WCUsers?" + q)
                .then(function (res) {
                    var results = res.data.d.results[0];
                    // saveLocal('WC-CurrentUser', results, 48);
                    deferred.resolve(results);
                });
            return deferred.promise;
        }

        function getReportsOfEmployee(employeeId) {
            var q = "hsf=@supervisor_id=" + employeeId;            
            var deferred = $q.defer();
            go.getHS("WCUsers?" + q)
                .then(function (res) {
                    var results = res.data.d.results;
                    // saveLocal('WC-CurrentUser', results, 48);
                    deferred.resolve(results);
                });
            return deferred.promise;
        }

        function getUserByName(name, force) {
            var q = "hsf=@name=" + name;
          var $select = '$select=firstname,lastname,name,office,sharepointid,photo,timekeeperid,email_address,networklogin,employeeid';
          // Updated filter: Inactive Employees can now be selected as well (Bug 3458).
          var url = "WCUsers?hsf=@sharepointid <> ''&" + $select;

          return go
              .getHS(url)
              .then(function (res) {
                  // TODO: SHOULD WE SAVE TO LOCAL ?
                  //  saveLocal('WCUsers-Active', results, 48);
                  return res.data.d.results;
              });
      }

      function getCurrentUser(spID, force) {
          var q = "hsf=@sharepointid=" + spID;

          // DATA EXISTS IN LOCAL STORAGE, IS NOT EXPIRED, AND 
          // THE FORCE FLAG IS NOT SET RETURN LOCAL DATA
          if (getLocal('WC-CurrentUser') && !force) {
              // console.log('Cached Version');
              return $q.resolve(getLocal('WC-CurrentUser'));
          }

            if (allUsers) {
                for (var i = 0; i < allUsers.length; i++) {
                    if (allUsers[i].name == name) {
                        return $q.resolve(allUsers[i]);
                    }
                }
            }
            return go
                .getHS("WCPeopleSvc?" + q)
                .then(function (res) {
                    var results = res.data.d.results[0];
                    saveLocal('WC-CurrentUser', results, 48);
                    return results;
                });
        }

        function getUserByLogin(networklogin, select) {
            var q = "hsf=@networklogin=" + networklogin;

            if (select) {
                q += '&$select=' + select;
            }

            return go
                .getHS("WCPeopleSvc?" + q);
        }

        function findPeople(term) {
            var url =
                "WCPeopleSvc?$filter=startswith(%20name_sort,%27" + term + "%27)";
            return go
                .getHS(url)
                .then(
                    function success(response) {
                        return response;
                    },
                    function error(response) {
                        return response;
                    }
                );
        }

        function searchPeopleDirectory(term) {

            // Fields to search for
            var fields = ['name', 'jobTitle', 'memberships', 'careerLevel', 'education'];

            var filter = '';
            for (var i = 0; i < fields.length; i++) {
                if (filter != '') filter += ' or ';
                filter = filter + fields[i] + '="*' + term + '*"';
            }

            var url = "WCPeopleSvc?hsf=@" + filter;

            return go
                .getHS(url)
                .then(
                    function success(response) {
                        return response;
                    },
                    function error(response) {
                        return response;
                    }
                )
        }

        function searchPeopleDirectoryCustomFilter(filter) {

            // Fields to search for
            var url = "WCPeopleSvc?hsf=@" + filter;

            return go
                .getHS(url)
                .then(
                    function success(response) {
                        return response;
                    },
                    function error(response) {
                        return response;
                    }
                )
        }

        function checkToken(token) {
            if (!token) return;

            var expiresOn = moment(token.created).add(token.expires, 'hours');
            var today = moment();

            if (today.isAfter(expiresOn)) {
                return false;
            }

            return true;

        }

        function saveLocal(key, data, expiresInHours) {
            var dateKey = key + '-saveToken';

            if (!expiresInHours) {
                expiresInHours = 0;
            }

            var token = {
                expires: expiresInHours,
                created: moment()
            };

            window.localStorage.setItem(key, JSON.stringify(data));
            window.localStorage.setItem(dateKey, JSON.stringify(token));
        }

        function getLocal(key) {
            var token = JSON.parse(window.localStorage.getItem(key + '-saveToken'));
            var result = window.localStorage.getItem(key);

            if (!checkToken(token) || result == null || result == 'undefined') {
                return false;
            }

            if (result !== null && result !== undefined) {
                return JSON.parse(result);

            }

            return false;

        }

        function formatOfficeLocation(location) {
            if (!location || !location.office) return '';
            return formatOfficeRoomFloor(location.office, location.room, location.floor);
        }

        function formatOfficeRoomFloor(office, room, floor) {
            var output = (office) ? office : '';
            if (!common.isNullOrWhitespace(floor)) {
                output += ", Floor #" + floor;
            }
            if (!common.isNullOrWhitespace(room)) {
                output += ", Room #" + room;
            }

            return output;
        }

        function personRowToJson(resultRow) {

            //Create empty person
            var person = {
                "email": "", //email
                "fullName": "", //name
                "firstName": "", //name[0]
                "id": "", //id
                "peopleId": "", //peopleId
                "peopleIdEmployee": "", //peopleIdEmployee
                "timekeeperNumber": "", //timekeeperNumber
                "image": "http://placehold.it/300", //peoplePhotoSmall or peoplePhotoLarge
                "lastName": "", //name[1]
                "officeCity": "", //location.office
                "officePhone": "", //contactInformation.telephone
                "officeState": "", //location.region
                "practiceArea": "", //regional.regionalSection
                "practiceAreaSubsection": "", //regional.subsection
                "roomNumber": "", //location.room
                "shortDialPhone": "", //contactInformation.shortDial
                "title": "", //title
                /* Person Full Details */
                "barAdmission": "", //barAdmission
                "bioUrl": "", //bioURL
                //"citizenship": "", //citizenship[]
                "fax": "", //contactInformation2.fax
                "firmMobile": "", //contactInformation2.firmMobile
                "personalMobile": "", //contactInformation2.personalMobile
                "contacts": "", //contacts
                "department": "", //department
                "documents": {}, //documents (transform)
                "education": [], //education[]
                "homeAddress1": "", //homeAddress.peopleHomeAddress1
                "homeAddress2": "", //homeAddress.peopleHomeAddress2
                "homeAddress3": "", //homeAddress.peopleHomeAddress3
                "homeCityStateZip": "", //homeAddress.peopleHomeCitystatezip
                "homeCountry": "", //homeAddress.peopleHomeCountry
                "homeFax": "", //homeFax
                "homePhone": "", //homeTelephone
                "matters": [], //matters.timeNote (transform)
                "partnerPractice": "", //partnerPractice[]
                "bio": "", //peopleBio
                "status": "", //peopleStatus.status
                "dateHired": "", //peopleStatus.dateHired
                "secretaries": "", //secretary
                "languages": "" //spokenLanguage[]
            };

            //Full name
            if (resultRow.name && resultRow.name.length > 0) {
                person.fullName = resultRow.name;
                var splitName = resultRow.name.split(' ');
                person.firstName = splitName[0];
                person.lastName = splitName[splitName.length - 1];
            } else {
                person.firstName = '_';
                person.lastName = '_';
            }

            //Email
            person.email = resultRow.email;

            //ID
            person.id = resultRow.id;

            //People ID
            person.peopleId = resultRow.peopleId;

            //People ID Employee
            person.peopleIdEmployee = resultRow.peopleIdEmployee;

            //Timekeeper Number
            person.timekeeperNumber = resultRow.timekeeperNumber;

            //Image - Note: use placeholder for now because the real image path is not accessible
            person.image = resultRow.peoplePhotoLarge ? resultRow.peoplePhotoLarge : resultRow.ppl_photo;

            //Location section
            if (resultRow.location) {
                //Office City
                person.officeCity = resultRow.location.office;

                //Office State
                person.officeState = resultRow.location.region;

                //Room Number
                person.roomNumber = resultRow.location.room;

                //Office + Room
                person.officeAndRoom = formatOfficeLocation(location);
            }

            //Regional section
            if (resultRow.regional) {
                //Practice Area
                person.practiceArea = resultRow.regional.regionalSection;
                person.practiceAreaSubsection = resultRow.regional.subsection;
            }

            //Office Phone
            person.officePhone = resultRow.contactInformation.telephone;

            //Short Dial Phone
            person.shortDialPhone = resultRow.contactInformation.shortDial;

            //Title
            person.title = resultRow.title;

            /* Person Full Details */

            //Only hydrate full bio if it was provided
            if (resultRow.peopleBio || resultRow.contactInformation2) {

                //Bar admission
                if (resultRow.barAdmission) {
                    person.barAdmission = resultRow.barAdmission;
                }

                //Bio URL
                if (resultRow.bioURL) {
                    person.bioUrl = resultRow.bioURL;
                }

                //Citizenship
                //if (resultRow.citizenship) {
                //    person.citizenship = resultRow.citizenship;
                //}

                //Fax
                if (resultRow.fax) {
                    person.fax = resultRow.fax;
                }

                //Extended contact info
                if (resultRow.contactInformation2) {
                    //Firm mobile
                    if (resultRow.contactInformation2.firmMobile) {
                        person.firmMobile = resultRow.contactInformation2.firmMobile;
                    }

                    //Personal mobile
                    if (resultRow.contactInformation2.personalMobile) {
                        person.personalMobile = resultRow.contactInformation2.personalMobile;
                    }
                }

                //TODO: Contacts
                //(no example in data)

                //Department
                if (resultRow.department) {
                    person.department = resultRow.department;
                }

                //Documents
                if (resultRow.documents && resultRow.documents.document) {
                    person.documents = common.docResultsToJson(resultRow.documents.document);
                }

                //Education
                if (resultRow.education) {
                    person.education = resultRow.education;
                }

                //Home address
                if (resultRow.homeAddress) {
                    if (resultRow.homeAddress.peopleHomeAddress1) {
                        person.homeAddress1 = resultRow.homeAddress.peopleHomeAddress1;
                    }
                    if (resultRow.homeAddress.peopleHomeAddress2) {
                        person.homeAddress2 = resultRow.homeAddress.peopleHomeAddress2;
                    }
                    if (resultRow.homeAddress.peopleHomeAddress3) {
                        person.homeAddress3 = resultRow.homeAddress.peopleHomeAddress3;
                    }
                    if (resultRow.homeAddress.peopleHomeCitystatezip) {
                        person.homeCityStateZip = resultRow.homeAddress.peopleHomeCitystatezip;
                    }
                    if (resultRow.homeAddress.peopleHomeCountry) {
                        person.homeCountry = resultRow.homeAddress.peopleHomeCountry;
                    }
                }

                //Home fax
                if (resultRow.homeFax) {
                    person.homeFax = resultRow.homeFax;
                }

                //Home phone
                if (resultRow.homeTelephone) {
                    person.homePhone = resultRow.homeTelephone;
                }

                //Matters (extract from time notes)
                if (resultRow.matters && resultRow.matters.timeNote && resultRow.matters.timeNote.length > 0) {
                    var matters = [];
                    for (var i = 0; i < resultRow.matters.timeNote.length; i++) {
                        var clientMatterId = resultRow.matters.timeNote[i].timeNoteClientMatterId;
                        if (i == 0 || !_.findWhere(matters, {
                            matterId: clientMatterId
                        })) {
                            matters.push({
                                matterId: clientMatterId,
                                matterName: resultRow.matters.timeNote[i].timeNoteClientMatterName
                            });
                        }
                    }
                    person.matters = matters;
                }

                //Partner practice
                if (resultRow.partnerPractice && resultRow.partnerPractice) {
                    if (common.isArray(resultRow.partnerPractice)) {
                        person.partnerPractice = resultRow.partnerPractice.join(', ');
                    } else {
                        person.partnerPractice = resultRow.partnerPractice;
                    }
                }

                //Bio
                if (resultRow.peopleBio) {
                    if (common.isArray(resultRow.peopleBio)) {
                        person.bio = resultRow.peopleBio.join(' ');
                    } else {
                        person.bio = resultRow.peopleBio;
                    }
                }

                //Status group
                if (resultRow.peopleStatus) {
                    //Status
                    if (resultRow.peopleStatus.status) {
                        person.status = resultRow.peopleStatus.status;
                    }
                    //Date hired
                    if (resultRow.dateHiredUtc && resultRow.dateHiredUtc.length > 0) {
                        person.dateHired = resultRow.dateHiredUtc;
                    } else if (resultRow.dateHired && resultRow.dateHired.length > 0) {
                        person.dateHired = resultRow.dateHired;
                    }
                }

                //Secretary
                if (resultRow.secretaries) {
                    person.secretaries = resultRow.secretaries;
                }

                //Languages
                if (resultRow.spokenLanguage && resultRow.spokenLanguage) {
                    if (common.isArray(resultRow.spokenLanguage)) {
                        person.languages = resultRow.spokenLanguage.join(', ');
                    } else {
                        person.languages = resultRow.spokenLanguage;
                    }
                }
            }

            return person;
        }

        // function getPeopleFromPeopleService(searchTerm) {

        //     searchTerm = searchTerm.replace(/[']/g, "''");
        //     searchTerm = encodeURIComponent(searchTerm);

        //     //var url = "http://sphandshake:56789/HandshakeWebServices/odata/odata.ashx/
        //     var url = "WCPeopleSvc?$select=*&hsf=@name='*" + searchTerm + "'";
        //     var bestbets = {};
        //     return go.getHS(url)
        //         .then(function success(response) {
        //             return response.data.d.results;
        //         }).catch(function error(response) {
        //             return response;
        //         });
        // }

        function getPeopleBySearch(searchTerm,top) {

            searchTerm = searchTerm.replace(/[']/g, "''");
            searchTerm = encodeURIComponent(searchTerm);
            
            //var url = "http://sphandshake:56789/HandshakeWebServices/odata/odata.ashx/
            var url = "WCPeopleSvc?$select=*&hsf=@name='*" + searchTerm + "*'";
            (top) ? url += "&$top=" + top : null;
            var bestbets = {};
            return go.getHS(url)
                .then(function success(response) {
                    return response.data.d.results;
                }).catch(function error(response) {
                    return response;
                });
        }

        function formatHSUserAsPerson(hsUserObject) {

            var contact = {};
            contact.contactInformation = {};
            contact.contactInformation.shortDial = hsUserObject.shortdial;
            contact.contactInformation.telephone = hsUserObject.phonenumber;
            contact.department = hsUserObject.displaydepartment;
            contact.email = hsUserObject.email;
            contact.id = hsUserObject.networklogin;
            contact.location = {};
            contact.location.floor = hsUserObject.floor;
            contact.location.room = hsUserObject.room;
            contact.location.office = hsUserObject.office;
            contact.location.region = hsUserObject.region;
            contact.name = hsUserObject.name;
            contact.nameSort = hsUserObject.name_sort;
            contact.peopleId = hsUserObject.timekeeperid;
            contact.peopleIdEmployee = hsUserObject.employeeid;
            contact.peoplePhotoSmall = hsUserObject.photo;
            contact.peopleStatus = {};
            contact.peopleStatus.dateHired = hsUserObject.datehired;            
            contact.peopleStatus.status = hsUserObject.jobstatus;
            contact.regional = {};
            contact.regional.regionalSection = hsUserObject.regionalsection;
            contact.regional.subsection = hsUserObject.subsection;
            contact.secretary = [hsUserObject.secs];
            contact.text = "";
            contact.title = hsUserObject.jobtitle;

            return contact;
        }

        function formatWCUserResult(wcuserResult) {

            var user = {};
            user.contactInformation = {};
            user.contactInformation.shortDial = wcuserResult.short_dial;
            user.contactInformation.telephone = wcuserResult.phone_number;
            user.department = wcuserResult.displaydepartment;
            user.email = wcuserResult.email;
            user.id = wcuserResult.networklogin;
            user.location = {};
            user.location.floor = wcuserResult.floor;
            user.location.room = wcuserResult.room;
            user.location.office = wcuserResult.office;
            user.location.region = wcuserResult.region;
            user.name = wcuserResult.name;
            user.nameSort = wcuserResult.name;
            user.peopleId = wcuserResult.timekeeperid;
            user.peopleIdEmployee = wcuserResult.employeeid;
            user.peoplePhotoSmall = wcuserResult.photo;
            user.peopleStatus = {};
            user.peopleStatus.dateHired = wcuserResult.date_hired;            
            user.peopleStatus.status = wcuserResult.job_status;
            user.regional = {};
            user.regional.regionalSection = wcuserResult.regional_section;
            user.regional.subsection = wcuserResult.subsection;
            //user.secretary = [wcuserResult.secs]; //Not available in WCUsers Class
            user.text = "";
            user.title = wcuserResult.job_title;

            return user;

        }

        function init() {
            getAllUsers().then(function (activeUsers) {
                if (typeof activeUsers == "string") {
                    allUsers = JSON.parse(activeUsers);
                }
                allUsers = activeUsers;
            });
        }
    }

})();