"use strict";

/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- LOCAL IPs */
console.log("-------------------------------------");
const network_interfaces = require("os").networkInterfaces();

Object.keys(network_interfaces)
      .forEach(function(name){
         console.log(name);
         console.log("[mac]   " + network_interfaces[name][0].mac);
         network_interfaces[name]
                .sort(function(a,b){return a.family.localeCompare(b.family);})  //order IPv4 before IPv6
                .forEach(function(address){
                   console.log("[" + address.family + "]  " + address.address);
                });
         console.log("-------------------------------------");
      });
/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */



/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=*/
function fetch(details){ //supports both headers and request body handling.
  var method      = details.method     || undefined
     ,url         = details.url        || undefined
     ,onresponse  = details.onresponse || undefined
     ,onheaders   = details.onheaders  || undefined
     ,onerror     = details.onerror    || undefined
     ;
  /* sample:
  ---------------------
  {
   "method"      :            for example: "HEAD" / "GET" ....
  ,"url"         :            for example: https://www.google.com/generate_204
  ,"onresponse"  :            function(
  ,"onheaders"   :
  ,"onerror"     :
  }
  ---------------------
  */
  const  URL                = require("url")
        ,HEADERS            = {"DNT":             "1"
                              ,"Accept":          "*/*"
                              ,"Referer":         "https://www.google.com/"
                              ,"Connection":      "Close"
                              ,"User-Agent":      "Mozilla/5.0 Chrome"
                              ,"Accept-Language": "en-US,en;q=0.9"
                              ,"Cache-Control":   "no-cache"
                              ,"Pragma":          "no-cache"
                              ,"X-Hello":         "Goodbye"
                              }
        ;

  url = URL.parse(url);

  const CONF = {"protocol": url.protocol               // "http:"
               ,"auth":     url.auth                   // "username:password"
               ,"hostname": url.hostname               // "www.example.com"
               ,"port":     url.port                   // 80
               ,"path":     url.path                   // "/"
               ,"family":   4                          // IPv4
               ,"method":   method
               ,"headers":  HEADERS
               ,"agent":    undefined                  //use http.globalAgent for this host and port.
               ,"timeout":  10 * 1000                  //10 seconds
               }
       ,REQUEST = (/https\:/.test(url.protocol) ? require("https") : require("http")).request(CONF)
       ,CONTENT = []
       ;
  var  last_response = undefined
       ;
  REQUEST.setSocketKeepAlive(false);                                      //make sure to return right away (single connection mode).
  REQUEST.on("response", function(response){
    last_response = response; //helps debugging in-case of an error...
    if("function" === typeof onheaders) onheaders(REQUEST,response,url,CONTENT.join("")); //response headers.
    if("function" === typeof onresponse){
      response.setEncoding("utf8");
      response.on("data", function(chunk){ CONTENT.push(chunk);                                  } );
      response.on("end",  function(){      onresponse(CONTENT.join(""), url, REQUEST, response); } );  //response body.
    }
  });
  REQUEST.on("error", function(e){         onerror(e, url, REQUEST, last_response);              } );  //should catch any error (both internal such as computer on offline mode, and remote HTTP-400-599 status.

  REQUEST.end();
}
/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=*/


const REGEX_IP = /[^\d]*(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})[^\d]*/m ;


console.log("=====================================");
console.log("[INFO] trying to figure out through-where your computer sends DNS queries to resolve web-addresses to IPs, this is usually called a GATEWAY address.");
var Resolver = require("dns").Resolver;
var gateway_addresses = [];
try{gateway_addresses = (new Resolver()).getServers() || []}catch(err){}
if(0 === gateway_addresses.length){
  console.log("[ERROR] no gateway addresses. you are offline and not connected to a router or having any way to resolving web-addresses to IP (usually done with DNS).");
  process.exitCode=222;
  process.exit();
}

gateway_addresses = JSON.stringify(gateway_addresses);
console.log("[INFO] you have a gateway addresses (one of those: " + gateway_addresses + " ) to resolve DNS queries, but they could be part of virtual-machine dummy network-adapters.  Testing will continue to see if you can resolve an \"always-on\" domain from the internet, into an actual IP address..");


console.log("=====================================");
console.log("[INFO] testing online DNS-resolving...");


const ALWAYS_ON_DOMAIN = "www.google.com"
     ,ALWAYS_ON_URL    = "https://www.google.com/generate_204"
     ,MYIP_URL         = "https://eladkarako.gigapages.net/myip.php"
     ;


console.log("[INFO] trying to resolve an \"always ON\" domain (\"" + ALWAYS_ON_DOMAIN + "\") to its IP(s), as a pre-condition to checkin if there is an internet-connection ON, this tests avilability of gateway (connectivity to router or a DNS-service).");
require("dns").resolve4(ALWAYS_ON_DOMAIN,{ttl:false},function(err,ips){
  if(null !== err || 0 === ips.length){
    console.error("[ERROR] DNS can not resolve a domain to IP, this usually means you can not connect to your gateway, meaning you are completely offline from your router, without even connection to internal network or DNS-service.");
    process.exitCode=333;
    process.exit();
  }
  
  if("0.0.0.0" === ips[0] || "127.0.0.1" === ips[0]){
    console.error("[ERROR] there is a problem. \"" + ALWAYS_ON_DOMAIN + "\" should not be resolved to 0.0.0.0 or 127.0.0.1, this means you've probably have blocked the domain in your \"C:\Windows\System32\drivers\etc\hosts\", having a network-service such as NetLimiter, firewall such as ZoneAlarm or Windows-Firewall blocking it. The test can not continue. trying running as admin: \"tcp-ip reset and rebuild.cmd\" and restarting your computer and trying again.");
    process.exitCode=444;
    process.exit();
  }
  
  console.log("[INFO] OK, DNS-resolving was able to resolve an address to IP, you can connect to a DNS-service (either locally or through your router, and if through your router, you might even have some internal network connectivity).");
})




console.log("[INFO] trying to check-online connection to an always ON URL address (\"" + ALWAYS_ON_URL + "\").");
fetch(
  {"method"    : "HEAD"
  ,"url"       : ALWAYS_ON_URL
  ,"onheaders" : function(){
                   console.log("[INFO] success. you are 100% connected to the internet.");
                   console.log("[INFO] trying to get your external IP using an external-URL service (\"" + MYIP_URL + "\").");
                   fetch(
                     {"method"     : "GET"
                     ,"url"        : MYIP_URL
                     ,"onresponse" : function(content){
                                       if(false === REGEX_IP.test(content)){
                                         console.error("[ERROR] can not find suitable IPv4 formation in the output from \"" + MYIP_URL + "\", maybe the programmer should switch that URL to something else...");
                                         process.exitCode=666;
                                         process.exit();
                                       }
                                       
                                       content = content.match(REGEX_IP)[1];
                                       console.log("=====================================");
                                       console.log("[INFO] External IP: (using \"" + MYIP_URL + "\"");
                                       console.log(content);
                                       console.log("=====================================");

                                       process.exitCode=0;
                                       process.exit();
                                     }
                     ,"onerror"   : function(){
                                       console.error("[ERROR] although you have internet-access, it seems \"" + MYIP_URL + "\" is not available, maybe the server is down, contact the script-maintainer and suggest trying \"https://ifconfig.io/ip\" or \"https://ipinfo.io/ip\" for external-IP extraction...");
                                       process.exitCode=777;
                                       process.exit();
                                    }
                     }
                   );
                 }
  ,"onerror"   : function(){
                   console.error("[ERROR] internet-connection error. can not access web-content. you are offline (but might still have an access to your internel-network).");
                   process.exitCode=555;
                   process.exit();
                 }
  }
);







/*
? https://eladkarako.gigapages.net/myip.php //sometimes the gigapages.net servers are down.
https://ifconfig.io/ip
https://ipinfo.io/ip
https://ip.cn                //a lot of HTML
https://ifconfig.co/x-real-ip
x  https://ifconfig.co/ip       //just IP. but has internal errors when it returns full html - do not use.
x  http://checkip.dyndns.org    //no HTTPS! (best to avoid)
*/

