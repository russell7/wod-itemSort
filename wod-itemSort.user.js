// ==UserScript==
// @name       wod item sorter
// @namespace  org.holer.webgame.util.wod
// @version    0.0.7
// @description  auto sort items in inventory
// @match      http://localhost/s.html
// @match      http://localhost/x.htm
// @copyright  2012+, Russell
// @require    http://code.jquery.com/jquery-1.7.1.min.js
// ==/UserScript==

$(function () {
    loadUi();
});

var selectHtml = '<select><option value="-go_lager">仓库</option><option value="go_group_2">团体仓库</option><option value="go_group">宝库</option><option value="go_keller">贮藏室</option><option value="npc">NPC</option></select>';
var liHtml = '<li><input/>'+selectHtml+'<button onclick="addRule(this)">append</button><button onclick="addException(this)">exception</button><button onclick="deleteRule(this)">delete</button></li>';
var olHtml = '<ol>'+liHtml+'</ol>';
var bsHtml = '<button onclick="wisGenerateRuleJsonI()">generate rule</button><button onclick="wisSaveRule()">save rule</button><button onclick="wisLoadRule()">load rule</button><br>';
var taHtml = '<textarea id="wiscj" style="width:80%;height:5em;"></textarea>';
var uiHtml = '<hr><div id="wisc">'+olHtml+bsHtml+taHtml+'</div>';
var abHtml = '<div><button onclick="applyWisRule()">apply</button></div>';

function loadUi() {
    $("div.gadget.main_content").after(uiHtml);
    $("div.search_container").after(abHtml);

    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.setAttribute("src","http://code.jquery.com/jquery-1.7.1.min.js");
    var sie = document.body || document.head || document.documentElement;
    sie.appendChild(script);

    script = document.createElement('script');
    script.appendChild(document.createTextNode('('+ main +')();'));
    sie.appendChild(script);
}

function main() {
    window.selectHtml = '<select><option value="-go_lager">仓库</option><option value="go_group_2">团体仓库</option><option value="go_group">宝库</option><option value="go_keller">贮藏室</option><option value="npc">NPC</option></select>';
    window.liHtml = '<li><input/>'+selectHtml+'<button onclick="addRule(this)">append</button><button onclick="addException(this)">exception</button><button onclick="deleteRule(this)">delete</button></li>';
    window.olHtml = '<ol>'+liHtml+'</ol>';

    window.addRule = function (bu) {
        var li = $(bu).parent();
        li.after(liHtml);
    }
    window.addException = function (bu) {
        var li = $(bu).parent();
        var ol = li.children("ol");
        if (ol.length) {
            ol.append(liHtml);
        } else{
            li.append(olHtml);
        }
    }
    window.deleteRule = function (bu) {
        var li = $(bu).parent();
        li.remove();
    }

    window.wisGenerateRuleJsonI = function () {
        var raw = wisGenerateRuleJson($("#wisc>ol"));
        var configJson = "{\"rules\":".concat(raw).concat("}");
        $("#wiscj").val(configJson);
    }

    window.wisGenerateRuleJson = function (jol) {
        var configJsonString = "[";
        var offset = jol.children("li").length - 1;
        jol.children("li").each(function(index, element) {
            var l = $(this);
            configJsonString = configJsonString.concat("{\"n\":\"");
            configJsonString = configJsonString.concat(l.children("input").val());
            configJsonString = configJsonString.concat("\",\"o\":\"");
            configJsonString = configJsonString.concat(l.children("select").val());
            configJsonString = configJsonString.concat("\"");
            var childOl = l.children("ol");
            if (0!=childOl.length && 0!=childOl.children("li").length) {
                configJsonString = configJsonString.concat(",\"e\":");
                configJsonString = configJsonString.concat(wisGenerateRuleJson(childOl));
            }
            configJsonString = configJsonString.concat("}");
            if (index != offset) {
                configJsonString = configJsonString.concat(",");
            }

        });
        return configJsonString.concat("]");
    }

    window.wisSaveRule = function () {
        var rule = $("#wiscj").val();
        var now = new Date();
        now.setDate(now.getDate()+3456);
        document.cookie = "wiscj="+escape(rule)+";expires="+now.toUTCString();
    }

    window.wisLoadRule = function () {
        var rule = getCookie("wiscj");
        if (rule) {
            $("#wiscj").val(unescape(rule));
        }
    }

    window.getCookie = function (name) {
        var equalSign = "=";
        var start = document.cookie.indexOf( name + equalSign );
        var len = start + name.length + equalSign.length;
        if ((!start) && (name != document.cookie.substring(0, name.length))){
            return null;
        }
        if (start == -1)
            return null;
        var end = document.cookie.indexOf(";", len);
        if (end == -1)
            end = document.cookie.length;
        return unescape(document.cookie.substring(len, end));
    }

    window.ruleObj = null;

    window.applyWisRule = function () {
        if (!ruleObj)
            ruleObj = getCookie("wiscj");
        if (!ruleObj)
            return;
        strToRegexI();
        $("table.content_table>tbody>tr").each(function () {
            var t = $(this);
            var o = getOperation(t.children("td").eq(1).children("a").text(), ruleObj.rules);
            if (o) {
                sort(t,o);
            }
        });
    }

    window.sort = function(t,o){
        t.children().eq(2).children("select").val(o);
        if ("npc"==o) {
            t.children().eq(3).children("input:checkbox").attr('checked', true);
        }
    }

    window.strToRegexI = function () {
        ruleObj = jQuery.parseJSON(ruleObj);
        if (ruleObj.regex) return;
        strToRegex(ruleObj.rules);
        ruleObj.regex = true;
    }

    window.strToRegex = function (l){
        var c;
        for(i in l){
            c = l[i];
            c.r = new RegExp(c.n);
            if (c.e) {
                strToRegex(c.e);
            }
        }
    }

    window.getOperation = function (name, list){
        var c;
        for(i in list){
            c = list[i];
            if (c.r.test(name)) {
                var o;
                if (c.e) {
                    o = getOperation(name, c.e);
                }
                return o?o:c.o;
            }
        }
    }

}