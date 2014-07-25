
*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    home: "http://intuift.herokuapp.com/mobile/",
    //home: "http://10.0.2.2:9000/mobile/",
    //home: "http://localhost:9000/mobile/",
    login: "login",
    indicators: "indicators",
    indicator: function(id) { return "indicators/"+id; },


    session: {},


    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', app.onDeviceReady, false);
        app.bindCloseAndRefreshButtons();
        app.bindFormSubmit();
        app.bindPageChange();
        app.bindIndicatorClick();
        //debug
        setTimeout(app.onDeviceReady, 500);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        $(document).ready(app.receivedEvent('deviceready'));        
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        // Try to retrieve login info from local storage
        app.loadSession();
        app.autoLogin();
    },

    bindCloseAndRefreshButtons: function() {
        $(document).on("click", ".closeApp", function(e) {
            e.preventDefault();
            navigator.app.exitApp();
            return false;
        });
        $(document).on("click", ".refresh", function(e) {
            var pageId = $(".ui-page-active").attr("id");
            app.changePage("#"+pageId);
            return false;
        });
    },

    bindFormSubmit: function() {
        $(document).on("click", "form a", function(e) {
            //e.preventDefault();
            app.showLoading("Login in");
            app.doLogin();
            return false;
        });
    },

    bindIndicatorClick: function() {
        $(document).on("click", "#indicatorsList a", function(e) {
            app.selectedIndicator = $(this).data("id");
            return true;
        })
    },

    bindPageChange: function() {
        $(document).on('pageshow', '#indicators', app.loadIndicators); 
        $(document).on('pageshow', '#indicator',  app.loadIndicator); 
    },

    doLogin: function(username, password, remember) {
        var username = username || $("#username").val();
        var password = password || $("#password").val();
        var remember = remember || $("#remember").is(":checked");

        app.onLogin = function(response) {
            if(response.message == "OK") {
                app.onLoginOk(username, password, remember);
            } else {
                app.onLoginFail(response.message);
            }
        };

        $.ajax({
          type: "get",
          url: app.home + app.login,
          crossDomain: true,
          dataType: "jsonp",
          jsonp: 'callback',
          jsonpCallback: 'app.onLogin',
          contentType : "application/json",
          data: {username: username, password: password}
        });
    },

    onLoginOk: function(username, password, remember) {
        app.hideLoading();
        app.session = {username: username, password: password}
        if(remember) {
            app.storeSession();
        }
        app.changePage("#indicators");
    },

    onLoginFail: function(error) {
        app.deleteSession();
        app.hideLoading();
        app.changePage("#login");
        app.showMessage(error);
    },

    autoLogin: function() {
        app.showLoading("Initializing...");
        console.log("attempt autologin");
        if (!jQuery.isEmptyObject(app.session)) {
            app.doLogin(app.session.username, app.session.password, true);
        } else {
            console.log("No autologin, no previous session");
            app.changePage("#login");
            app.hideLoading();
        }
    },

    loadSession: function() {
        app.session = JSON.parse(window.localStorage.getItem("session") || "{}");
        console.log(JSON.stringify(app.session));
    },

    storeSession: function() {
        window.localStorage.setItem("session", JSON.stringify(app.session));
    },

    deleteSession: function() {
        app.session = {};
        window.localStorage.removeItem("session");
    },

    showLoading: function(text) {
        $.mobile.loading( "show", {
          text: text || "",
          textVisible: true,
          theme: "b",
        });
    },

    hideLoading: function() {
        $.mobile.loading( "hide");
    },

    showMessage: function(text, timeout) {
        timeout = timeout || 1500;
        $.mobile.loading( "show", {
          text: text,
          textVisible: true,
          textonly: true,
          theme: "b",
        });        
        setTimeout(function() { $.mobile.loading("hide"); }, 1500 );
    },

    changePage: function(newPage, options) {
        options = options || {allowSamePageTransition  : true};
        $(":mobile-pagecontainer").pagecontainer("change", newPage, options);
    },


    loadIndicators: function() {
        console.log("loading indicators");
        app.showLoading();
        $.ajax({
          type: "get",
          url: app.home + app.indicators,
          crossDomain: true,
          contentType : "application/json",
          dataType: "jsonp",
          jsonp: 'callback',
          jsonpCallback: 'app.onIndicatorsLoad',
        });
    },

    onIndicatorsLoad: function(indicators) {
        console.log("load indicators ok");
        var items = [];
        $.each(indicators, function(i, indicator) {
          items.push('<li><a href="#indicator" data-id="' + indicator.id + '">' + indicator.name + '</a></li>');
        });
        $("#indicatorsList").html(items.join("\n")).listview('refresh');
        app.hideLoading();
    },

    loadIndicator: function() {
        console.log(app.home + app.indicator(app.selectedIndicator));
        app.showLoading();
        $.ajax({
          type: "get",
          url: app.home + app.indicator(app.selectedIndicator),
          crossDomain: true,
          contentType : "application/json",
          dataType: "jsonp",
          jsonp: 'callback',
          jsonpCallback: 'app.onIndicatorLoad',
        });
    },

    onIndicatorLoad: function(indicator) {
        app.showIndicator(indicator);
    },

    showIndicator: function(indicator) {
        if(jQuery.isEmptyObject(indicator)) {
            console.log("No indicator selected");
            app.changePage("#indicators");
        } else {
            $(".ui-page-active .ui-title").html(indicator.name);
            $("#chartContainer").html("");
            charts.valueChart("#chartContainer", indicator);
            //charts.historyChart("#chartContainer", indicator);
        }
        app.hideLoading();
    },
};

app.initialize();
