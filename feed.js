/*
 * Javascript to control the population of the feed
 *
 * Currently Feed is the popup modal shown when the ext bar button is clicked
 *  
 *
 * By Wilson QIn
 */


/*
 * Shorten a title
 *
 */
//TODO

 /* 
 *  produce the domain of a site
 *  takes urlString expected of format: [http protocol]://[domain maybe w subdomain]/slug
 */
function getDomainFromURL(urlString){
  var parts = urlString.split("://");

  var domainParts, domain;
  if(parts.length == 2){
    domainParts = parts[1].split("/");
    domain = domainParts[0];
    domain = domain.replace("www.", "");
  }
  return domain;
}

/*
 * Construct article string
 *
 */
function genArticleString(i, title, link, date){
  var str = '<span class="article-textliner"><span class="article-link"><a href="' + link + '" target="_blank">' + title + '</a>';
  str += '</span>';
  str += '<span class="article-subtext">';
  str += getDomainFromURL(link);
  str += " - from ";
  str += moment(new Date(date)).fromNow();
  str += "</span></span>";


  var buttonStr = '<div class="article-buttons"><button>Done</button></div>';

  str = '<div class="article" data-article-id=' + i +'>' + buttonStr + str + '</div>';

  return str;
}




/* 
 * Load the articles stored from local storage
 *
 * For now will load all
 */
function loadFeed(){
  var articleIDs = chrome.extension.getBackgroundPage().getArticleIDs();
  var keyPrefixes = chrome.extension.getBackgroundPage().getKeyPrefixes();

  var loading = $.Deferred();

  $("#feed-empty-message").hide();
  $("#feed-waiting-animation").show();
  
  chrome.storage.local.get(null, function(data){
    var i, isNothing;

    if(articleIDs.length > 0){
      for(i = 0; i < articleIDs.length; i++){
        var title = data[articleIDs[i] + "-" + keyPrefixes.title];
        var link = data[articleIDs[i] + "-" + keyPrefixes.link];
        var date = data[articleIDs[i] + "-" + keyPrefixes.date];
        var html = genArticleString(articleIDs[i], title, link, date);
        $("#feed").append(html);
      }
      isNothing = false;
    }else{
      isNothing = true; 
    }

    loading.resolve(isNothing);
  });

  $.when(loading).done(function(isN){
    $("#feed-waiting-animation").hide()
    if(isN){
      $("#feed-empty-message").show();
    }else{
      $('#feed-empty-message').hide();
    }
  });

  return loading;
}

/*
 *  Event Handler to deal with deleting an article
 */
function deleteArticleHandler(e){
  var article, id;

  var showStatus = $(this).css("background-color", "green");
  var isLastArticle = ( $(".article").length == 1 );

  $.when(showStatus).done(function(){
    article = $(this).parents(".article");
    id = article.data("article-id");
    
    var animating = article.slideUp("fast");

    $.when(animating).done(function(){
      // removed permanently from DOM after clearance animation
      article.remove();

      if(isLastArticle){
        //if there are no more articles left, display empty feed message
        $("#feed-empty-message").show();
      }
    });

    var bg = chrome.extension.getBackgroundPage();

    // actually propogate delete to the storage
    bg.removeArticle(id)
    
    bg.removeArticleID(id);
    bg.saveArticleIDs(function(){});
  });
}

/*
 * Clears all articles from local storage and otherwise
 * 
 */
function clearAllHandler(){
  var $articles = $("#feed .article");
  var rendering = $articles.slideUp("slow");
  chrome.extension.getBackgroundPage().reset();

  $.when(rendering).done(function(){
    // redisplay empty message
    $("#feed-empty-message").show();
    $articles.remove();
  });
}


document.addEventListener('DOMContentLoaded', function() {
  $(function(){
    var loading = loadFeed();

    // attach live event handlers after loading is complete
    $.when(loading).done(function(){
      $(".article-buttons > button").on('click', deleteArticleHandler);
      $("#settings-bar > button").on('click', clearAllHandler);
    });
  });
});