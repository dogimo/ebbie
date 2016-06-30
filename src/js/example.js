$(document).ready(function(){
    $(".component__desc").hover(function() {
        $(this).addClass("is-mouseover");
    }).mouseout(function() {
        $(this).removeClass("is-mouseover");
    });
});