/*
 * Javascript to control the population of the feed
 *
 * Currently Feed is the popup modal shown when the ext bar button is clicked
 *  
 */

/*
 * Construct article string
 *
 */
function genArticleString(i, title, link){
  var str = '<a href="' + link + '" target="_blank">' + title + '</a>';

  str =  '<div class="article">' + str + '</div>';

  chrome.extension.getBackgroundPage().console.log(str);

  return str;
}


/* 
 * Load the articles stored from local storage
 *
 * For now will load all
 */
function loadFeed(){
  var articleIDs = chrome.extension.getBackgroundPage()._PL_ArticleIDs;
  var keyPrefixes = chrome.extension.getBackgroundPage()._PL_KeyPrefixes.v0;
  
  chrome.extension.getBackgroundPage().console.log(articleIDs);
  
  chrome.storage.local.get(null, function(data){
    chrome.extension.getBackgroundPage().console.log(data);
    var i;
    for(i = 0; i < articleIDs.length; i++){
      var title = data[articleIDs[i] + "-" + keyPrefixes.title];
      var link = data[articleIDs[i] + "-" + keyPrefixes.link];
      var html = genArticleString(i, title, link);
      $("#feed").append(html);
    }
  });
}



document.addEventListener('DOMContentLoaded', function() {
  $(function(){
    loadFeed();
  });
});