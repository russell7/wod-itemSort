$(function () {
    loadUi();
});

var selectHtml = '<select><option value="-go_lager">仓库</option><option value="go_group_2">团体仓库</option><option value="go_group">宝库</option><option value="go_keller">贮藏室</option><option value="npc">NPC</option></select>';
var liHtml = '<li><input/>'+selectHtml+'<button onclick="addRule(this)">append</button><button onclick="addException(this)">exception</button><button onclick="deleteRule(this)">delete</button></li>';
var olHtml = '<ol>'+liHtml+'</ol>';
var uiHtml = '<div id="wisc">'+olHtml+'</div>';

function loadUi() {
    $("div.gadget.main_content").after(uiHtml);
}

function addRule(bu) {
    var li = $(bu).parent();
    li.after(liHtml);
}

function addException(bu) {
    var li = $(bu).parent();
    var ol = li.children("ol");
    if (ol.length) {
        ol.append(liHtml);
    } else{
        li.append(olHtml);
    }
}

function deleteRule(bu) {
    var li = $(bu).parent();
    li.remove();
}