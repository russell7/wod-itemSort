// ==UserScript==
// @name       wod item sorter
// @namespace  org.holer.webgame.util.wod
// @version    0.0.7
// @description  auto sort items in inventory
// @match      http://*.world-of-dungeons.org/wod/spiel/hero/items.php*
// @match      http://localhost/x.htm
// @copyright  2012+, Russell
// ==/UserScript==

var script = document.createElement('script');
script.setAttribute("type", "application/javascript");
script.setAttribute("src","http://code.jquery.com/jquery-1.7.1.min.js");
var sie = document.body || document.head || document.documentElement;
sie.appendChild(script);

script = document.createElement('script');
script.appendChild(document.createTextNode('('+ main +')();'));
sie.appendChild(script);

function main() {
    window.wisMsgg = {
        applySortRule: "apply sort rules",
        autoSort: "auto sort",
        append: "append",
        exception: "exception",
        deleteStr: "delete",
        generateRule: "generate rule",
        saveRule: "save rule",
        loadRule: "load rule"
    };

    window.wisMsg = {
        applySortRule: "整理",
        autoSort: "自动整理",
        append: "增加规则",
        exception: "增加例外规则",
        deleteStr: "删除",
        generateRule: "生成规则",
        saveRule: "保存规则",
        loadRule: "加载已保存的规则"
    };

    window.selectHtml = '<select><option value="-go_lager">仓库</option><option value="go_group_2">团体仓库</option><option value="go_group">宝库</option><option value="go_keller">贮藏室</option><option value="npc">NPC</option></select>';
    window.liHtml = '<li><input/>'+selectHtml+'<button onclick="addRule(this)" class="button">'+wisMsg.append+'</button><button onclick="addException(this)" class="button">'+wisMsg.exception+'</button><button onclick="deleteRule(this)" class="button">'+wisMsg.deleteStr+'</button></li>';
    window.olHtml = '<ol>'+liHtml+'</ol>';
    window.bsHtml = '<button onclick="wisGenerateRuleJsonI()" class="button">'+wisMsg.generateRule+'</button><button onclick="wisSaveRule()" class="button">'+wisMsg.saveRule+'</button><button onclick="wisLoadRule()" class="button">'+wisMsg.loadRule+'</button><br>';
    window.taHtml = '<textarea id="wiscj" style="width:100%;height:5em;"></textarea>';
    window.uiHtml = '<hr><div id="wisc" class="gadget_body">'+olHtml+bsHtml+taHtml+'</div>';
    window.btnsHtml = '<div><button id="wisawrb" onclick="applyWisRule()" class="button">'+wisMsg.applySortRule+'</button><input id="wisar" type="checkbox" onclick="setAutoSort()"><label for="wisar">'+wisMsg.autoSort+'</label></div>';

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
        setCookie("wiscj",rule);
    }

    window.setCookie = function (key,value) {
        var now = new Date();
        now.setDate(now.getDate()+3456);
        document.cookie = key+"="+escape(value)+";expires="+now.toUTCString();
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
        if ("npc"==o) {
            t.children().eq(3).children("input:checkbox").attr('checked', true);
        } else {
            t.children().eq(2).children("select").val(o);
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

    window.setAutoSort = function (){
        setCookie("wisas",0 != $("#wisar:checked").length);
    }

    window.autoSort = function (){
        var c = getCookie("wisas");
        if(c && "true"==c) {
            $("#wisar").attr("checked", true);
            $("#wisawrb").click();
        }
    }

    window.injectUi = function (){
        $("div#main_content").after(uiHtml);
        $("div#main_content").after(btnsHtml);
    }

    window.addEventListener("load",injectUi,false);

    window.addEventListener("load",autoSort,false);
}