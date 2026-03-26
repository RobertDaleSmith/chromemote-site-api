$(window).bind("ready", function() {
    
    //Initialize the screen-shot carousel.
	initCarousel();

	//Initialize mobile menu menthods.
	initMobileMenu();

	initPaymentStuff();

	initLeaveTipButton();
	
	initFaqToggleButtons();

	initDisqusComments();

	initRequestKey();

	initSupportComments();

	initUpdatePage();

	$("#sunset_msg .close, #submit_agree_btn").click(function(){
		$("#sunset_msg").css('display','none');
	});

	var cws = new inlineCWS("bhcjclaangpnjgfllaoodflclpdfcegb");

});

$( window ).resize(function() {
	var width = $(window).width();

	//Turn off mobile menu if open when mobile mode is left.
	if(width >= 480 && mobileMenuOpen) $("#nav_menu_btn").click();

	if(document.getElementById("blog_post_editor")){
		if( parseInt($('#blog_post_editor').css("left").replace("px","")) + $('#blog_post_editor').width() > $(window).width() ){
			$('#blog_post_editor').css("left", $(window).width() - $('#blog_post_editor').width() );
		}
	}
})

function initCarousel(){

	$('.jcarousel').jcarousel({
        scroll: 1,
	    auto: .01,
	    wrap: 'last',
	    easing: 'linear'
    }).jcarouselAutoscroll({
        interval: 3500,
        target: '+=1',
        autostart: true,
        create: $('.jcarousel').hover(function() {
	        $(this).jcarouselAutoscroll('stop');
	    }, function() {
	        $(this).jcarouselAutoscroll('start');
	    })
    });

	$('#carousel_left_btn').bind( "tap", function(){
        $('.jcarousel').jcarousel('scroll', '-=1');
    });

    $('#carousel_right_btn').bind( "tap", function(){
        $('.jcarousel').jcarousel('scroll', '+=1');
    });

    $('.jcarousel-pagination')
    .on('jcarouselpagination:active', 'a', function() {
        $(this).addClass('active');
    })
    .on('jcarouselpagination:inactive', 'a', function() {
        $(this).removeClass('active');
    })
    .jcarouselPagination();

}

var mobileMenuOpen = false;
function initMobileMenu(){
	$("#nav_menu_btn").bind( "tap", function(){
		//log(mobileMenuOpen);
		if(mobileMenuOpen){
			$("#menu").css("top","-256px");
			$("#menu").css("-webkit-animation","slideOut 500ms ease-out");
			$("#navMenu").css("border-color","");
			$("#navMenu").css("height","");
			$("#nav_menu_btn").css("border-color","");
			// $("#nav_menu_btn").css("background-color","");
			mobileMenuOpen = false;
		} else {
			$("#menu").css("top","45px");
			$("#menu").css("-webkit-animation","slideIn 500ms ease-out");
			$("#navMenu").css("border-color","#00A3B1");
			$("#navMenu").css("height","65px");
			$("#nav_menu_btn").css("border-color","rgba(39,168,184,0.35)");
			// $("#nav_menu_btn").css("background-color","rgba(39,168,184,0.05)");
			mobileMenuOpen = true;
		}
	});


}

var payTypePopOpen = false,
     currentAmount = 30,
       paymentType = "";
function initPaymentStuff(){

	$(function() {
    	$( "#slider" ).slider({    	
	    	value: 30,
	    	min: 5,
	    	max: 200,
	    	step: 5,
	    	slide: function( event, ui ) {
	        	$( "#amount" ).val( "$" + ui.value + ".00" );
	        	currentAmount = ui.value;
	  		}
    	});
    	$( "#amount" ).val( "$" + $( "#slider" ).slider( "value" ) + ".00" );
  	});
  	setTimeout(function(){$("#slider").css('display','block');},1000);

	$(".contribute_payment_type").bind( "tap", function(){
		if(payTypePopOpen){			 
			$(".contribute_payment_type").attr("class","contribute_payment_type");
			$(".contribute_payment_type_drop ").css("display","");
			payTypePopOpen = false;
		}else{
			$(".contribute_payment_type").attr("class","contribute_payment_type open");
			$(".contribute_payment_type_drop ").css("display","block");
			payTypePopOpen = true;
		}
	});

	$(".payment_type").bind( "tap", function(){
		paymentType = $(this).text();
		$(".contribute_payment_type .value").text( paymentType );
		$(".contribute_payment_type").attr("class","contribute_payment_type");
		$(".contribute_payment_type_drop ").css("display","");
		payTypePopOpen = false;
	});


	try{
		//StripeCheckout
		var stripeHandler = StripeCheckout.configure({
			//key: 'pk_test_mwaeY0Yhqo7J3gfY1RognVnf',
			key: 'pk_live_4Rj1Ayjy2iZvYkn8Uxf0slLX',
			image: '/images/icon128.png',
			token: function(token, args) {
				// Use the token to create the charge with a server-side script.
				// You can access the token ID with `token.id`
				log(token);
				log(args);

				var data = {};
				data.token = token;
				data.args = args;
				data.amount = currentAmount;

				$.ajax({
			        type: 'POST',
			        data: JSON.stringify(data),
			        contentType: 'application/json',
			        url: '/support-us/stripe',                                                
			        success: function(result) {
			            log('success');
			            log(result);
			            window.open("/support-us/thank-you/","_self");
			        }
			    });


			}
		});	
	}catch(e){}
	

	$("#continuePayment").bind( "tap", function(){

		var tracking = "CMTJ01";
        var pageTracker = _gat._getTracker("UA-34201638-1");

		if(paymentType == "Credit Card"){
			// Open Checkout with further options
			stripeHandler.open({
				name: 'Chromemote',
				description: 'Premium Supporter ($'+currentAmount+'.00)',
				amount: (currentAmount * 100),
				currency: "USD",
				panelLabel: "Contribute {{amount}}",
				billingAddress: true
			});
			paymentTracking();

		} else if(paymentType == "PayPal"){

			//log("PayPal");
			$("#paypal_amount_input").val(currentAmount);
			document.getElementById("paypal-form").submit();
			paymentTracking();

		} else if(paymentType == "Amazon Payments"){

			var minimumDonationAmount = "USD " + currentAmount,
				signature = getAmazonSignature(currentAmount);

			// log("Amazon Payments");
			// var amountIndex = (currentAmount / 5) - 1;
			// $("#amazon_amount").prop('selectedIndex', amountIndex);  

			$("#amazonDonationAmount").attr("value",minimumDonationAmount);
			$("#amazonSignature").attr("value",signature);

			$("#amazon_btn").click();
			paymentTracking();

		} else {
			$(".contribute_payment_type").tap();
		}
		
	});

}


function ipnTest(){

	var data = {};

	$.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '/support-us/ipn',                                    
        success: function(result) {
            log('success');
            log(result);
        }
    });
}


function initFaqToggleButtons(){

	$(".faq_item .head").bind( "tap", function(){
		if( $(this).parent().find(".body").css("display") == "block" ){
			//Close this one remove hash.
			$(this).parent().find(".body").css("display","");
			$(this).find(".toggle").html("+");
			$(this).find(".toggle").removeClass("open");
			history.pushState("", document.title, window.location.pathname + window.location.search);
		} else {
			//Close others.
			$(".faq_item .body").css("display","");
			$(".faq_item .head .toggle").html("+");
			$(".faq_item .head .toggle").removeClass("open");

			//Open this one.
			$(this).parent().find(".body").css("display","block");
			$(this).find(".toggle").html("-");
			$(this).find(".toggle").addClass("open");

			//Add hash and scroll to.
			window.location.hash = $(this).parent().attr("name");
			$("#body_container").animate( { scrollTop: $(this).offset().top - 30}, 400, function() {});
		}
	});

	//If hash found, then goto it.
	if(window.location.hash.replace("#","") != "")
		$('[name="' + window.location.hash.replace("#","") + '"] .head').click();
}


function initDisqusComments(){

	if(document.getElementById("disqus_thread")){
		/* * * CONFIGURATION VARIABLES: EDIT BEFORE PASTING INTO YOUR WEBPAGE * * */
	    var disqus_shortname = 'Chromemote'; // required: replace example with your forum shortname

	    /* * * DON'T EDIT BELOW THIS LINE * * */
	    (function() {
	        var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
	        dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
	        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
	    })();
	}
	
}



function getFormattedDate(date){
	if(date == null) date = new Date();
    var todaysMonth = date.getMonth()+1,
    	todaysDay   = date.getDate(),
    	todaysYear  = date.getFullYear();
    if(todaysMonth < 10) todaysMonth = "0"+todaysMonth;
    if(todaysDay < 10) todaysDay = "0"+todaysDay;
    return todaysYear + "/" + todaysMonth + "/" + todaysDay;
}

function getMonth(text) {
  var res = parseInt(text.substring(5,7));
  switch(res) {
    case 1:  res = "Jan"; break; case 2:  res = "Feb"; break; case 3:  res = "Mar"; break;
    case 4:  res = "Apr"; break; case 5:  res = "May"; break; case 6:  res = "Jun"; break;
    case 7:  res = "Jul"; break; case 8:  res = "Aug"; break; case 9:  res = "Sept";break;
    case 10: res = "Oct"; break; case 11: res = "Nov"; break; case 12: res = "Dec"; break;
  }
  return res;
}

function getDay(text) {
  var res = parseInt(text.substring(8,10));
  return res;
}

function initRequestKey(){
	if(document.getElementById("email_address_input")){
		$("#get_key_button").click(function(){
			var emailAddress = $("#email_address_input").val();
			if(emailAddress != ""){
				var data = {};
				data.emailAddress = emailAddress;

				$.ajax({
			        type: 'POST',
			        data: JSON.stringify(data),
			        contentType: 'application/json',
			        url: '/getKey/keyGen',                                                
			        success: function(result) {
			            //log('success');
			            //log(result.status);
			            if(result.status == 0){
			            	//show error

			            	$("#alert_box").css("display","block");
			            	$("#alert_box p").html("Oh no :-( &nbsp;&nbsp;Your email address was not found. Please use the same email used when you made a contribution.<br><br>Not made a contribution yet? <a href='/support-us/'>Contribute&nbsp;Now!</a>");
			            	$("#alert_box").attr('class', 'alert alert-danger');

			            } else if(result.status == 1){
			            	//show success

			            	$("form").css("display","none");
			            	$("#alert_box").css("display","block");
			            	$("#alert_box p").html("<b>Success!</b><br>Your activation key is surfing its way to your email inbox right now...<br><br><br><b class='face'>:-)</b>");
			            	$("#alert_box").attr('class', 'alert alert-success');
			            } else if(result.status == -1){

			            	$("#alert_box").css("display","block");
			            	$("#alert_box p").html("Hmmmmm... &nbsp;&nbsp;Something isn't working right at the moment. Please try again later.");
			            	$("#alert_box").attr('class', 'alert alert-success');
			            }
			            
			            
			        }
			    });
			}
			


			
		});	
	}
}





function inlineCWS(id){
	var webstoreID = id;
	init();

	function init() {
		if (/chrom(e|ium)/.test(navigator.userAgent.toLowerCase())) {
		    if(document.getElementById("install_button")){
		        document.getElementById("install_button").onclick = install;
		    }
		// } else {
		// 	window.open('https://chrome.google.com/webstore/detail/bhcjclaangpnjgfllaoodflclpdfcegb/publish-accepted','_blank');
		}

	    if (document.getElementById('extension-is-installed')) {
	        if(document.getElementById("install_button")){
	        	$('#install_button p').text("INSTALLED!");
	        	log("Extension is installed.");
	        }                   
	    }
	    if (chrome.app.isInstalled) {
		    if(document.getElementById("install_button")){
		    	$('#install_button p').text("INSTALLED!");
		    	log("Extension is installed..");
		    }	        
		}
	}

	function install() {
		if (chrome.webstore) {
			chrome.webstore.install("https://chrome.google.com/webstore/detail/"+webstoreID, success, fail);

			if (document.getElementById('extension-is-installed')) {
		        if(document.getElementById("install_button")){
		        	$('#install_button p').text("UPDATING...");
		        	log("Updating existing.");
		        }
		    } else {
		        if(document.getElementById("install_button")){
		        	$('#install_button p').text("INSTALLING...");
		        	log("Installing new.");
		        }
		    }
		} else {
			var url = 'https://chrome.google.com/webstore/detail/bhcjclaangpnjgfllaoodflclpdfcegb/publish-accepted';
			window.open(url, '_blank');
		}
	}

	function success() {
	    if (document.getElementById('extension-is-installed')) {    
	        if(document.getElementById("install_button")){
	        	$('#install_button p').text("UPDATED!");
	        	log("Success updated existing.");
	        }    
	    } else {        
	        if(document.getElementById("install_button")){
	        	$('#install_button p').text("INSTALLED!");
	        	log("Success installed new.");
	        }    
	    }	                            
	    setTimeout(function(){
	        this.document.location.href = "http://www.chromemote.com/support-us/";    
	    },2500);	    
	}

	function fail() {
	    if (document.getElementById('extension-is-installed')) {	        
	        if(document.getElementById("install_button")){
	        	$('#install_button p').text("INSTALL NOW");
	        	log("Failed to update existing.");
	        }	                                
	    } else {
	        if(document.getElementById("install_button")){
	        	$('#install_button p').text("INSTALL NOW");
	        	log("Failed to install new.");
	        }
	    }
	}
}



function log(msg){
	if(console) console.log(msg);
}



function initSupportComments(){
	$("#submit_code_signup_btn").click(function(){
		var emailInput = $("#dev_interest_email").val();

		if(validateEmail(emailInput)){
			var data = {};
			data.email = emailInput;

			$.ajax({
		        type: 'POST',
		        data: JSON.stringify(data),
		        contentType: 'application/json',
		        url: '/support-us/dev-signup',                                                
		        success: function(result) {
		            log('success');
		            log(result);
		            $("#dev_interest_email").val("");
		            $("#dev_signup_msg").html("<br>Thanks! We will be in contact with you shortly.<br>");
		            $("#dev_interest_email").fadeOut( "slow", function() { });
					$("#submit_comment_btn").fadeOut( "slow", function() { });
		        }
		    });


		} else {
			setTimeout(function(){$("#dev_interest_email").css("border-color","#ff0000");setTimeout(function(){$("#dev_interest_email").css("border-color","");setTimeout(function(){$("#dev_interest_email").css("border-color","");setTimeout(function(){$("#dev_interest_email").css("border-color","#ff0000");setTimeout(function(){$("#dev_interest_email").css("border-color","");setTimeout(function(){$("#dev_interest_email").css("border-color","#ff0000");setTimeout(function(){$("#dev_interest_email").css("border-color","");
		        $("#dev_interest_email").focus();
		    },100);},100);},100);},100);},100);},100);},100);
		}
		log( );
	});


	$("#submit_comment_btn").click(function(){
		var nameInput  = $("#comment_name").val(),
			emailInput = $("#comment_email").val(),
			msgInput   = $("#comment_msg").val();

		if(validateEmail(emailInput)){
			var data = {};
			data.name  = nameInput;
			data.email = emailInput;
			data.msg   = msgInput;

			$.ajax({
		        type: 'POST',
		        data: JSON.stringify(data),
		        contentType: 'application/json',
		        url: '/support-us/comment',                                                
		        success: function(result) {
		        	//$('#comment_name').val("");
		            //$('#comment_email').val("");
		            $('#comment_msg').val("");
		            log('success');
		            log(result);
		            alert('Thanks for the message. I will get back to you as soon as possible. Thanks so much for the feedback.');

		        }
		    });


		} else {
			setTimeout(function(){$("#comment_email").css("border-color","#ff0000");setTimeout(function(){$("#comment_email").css("border-color","");setTimeout(function(){$("#comment_email").css("border-color","");setTimeout(function(){$("#comment_email").css("border-color","#ff0000");setTimeout(function(){$("#comment_email").css("border-color","");setTimeout(function(){$("#comment_email").css("border-color","#ff0000");setTimeout(function(){$("#comment_email").css("border-color","");
		        $("#comment_email").focus();
		    },100);},100);},100);},100);},100);},100);},100);
		}
	});

}

function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
} 

function paymentTracking() {

	var timestampYear  = new Date().getUTCFullYear();
	var timestampMonth = new Date().getUTCMonth();
	var timestampDay   = new Date().getUTCDate();
	var timestampHour  = new Date().getUTCHours();
	var timestampMin   = new Date().getUTCMinutes();
	var timestampSec   = new Date().getUTCSeconds();
	var timestampMil   = new Date().getUTCMilliseconds();
	
	var timestamp = "" + timestampYear + timestampMonth + timestampDay + timestampHour + timestampMin + timestampSec + timestampMil;
	
	//alert(timestamp);
	// var val = $("#slider").val();
	// var dollars = Math.min(Math.pow(val/5, 2) + 5, 400);
	
	// if (val == 0) dollars = 0;
 //    var roundTo = (dollars <= 10 ? 1 : dollars <= 150 ? 5 : 25);
 //    dollars = Math.floor(dollars / roundTo) * roundTo;
    
	// var amtString = dollars + ".00";
	var amtString = currentAmount;
	
	//alert(amtString);
	
	var tracking = "CMTJ01";
	var pageTracker = _gat._getTracker("UA-34201638-1");
	try{
			
		pageTracker._trackPageview();
		pageTracker._addTrans(
			timestamp,          // transaction ID - required
		   	"Chromemote",  		// affiliation or store name
			amtString,          // total - required
			"0.00",            	// tax
			"0.00"//,           // shipping
			//"San Jose",       // city
			//"California",     // state or province
			//"USA"             // country
			);


		// add item might be called for every item in the shopping cart
		// where your ecommerce engine loops through each item in the cart and
		// prints out _addItem for each 
		pageTracker._addItem(
		   	"1234",           	// transaction ID - necessary to associate item with transaction
		   	tracking,           // SKU/code - required
		   	"Tip Jar",        	// product name
		   	amtString,   		// category or variation
		   	amtString,        	// unit price - required
		   	"1"               	// quantity - required
		);

		pageTracker._trackTrans(); //submits transaction to the Analytics servers
	} catch(err) { }
	pageTracker = _gat._getTracker("UA-30458910-1");
	try{
			
		pageTracker._trackPageview();
		pageTracker._addTrans(
			timestamp,          // transaction ID - required
		   	"Chromemote",  		// affiliation or store name
			amtString,          // total - required
			"0.00",            	// tax
			"0.00"//,           // shipping
			//"San Jose",       // city
			//"California",     // state or province
			//"USA"             // country
		);


		// add item might be called for every item in the shopping cart
		// where your ecommerce engine loops through each item in the cart and
		// prints out _addItem for each 
		pageTracker._addItem(
		   	"1234",           	// transaction ID - necessary to associate item with transaction
		   	tracking,           // SKU/code - required
		   	"Tip Jar",        	// product name
		   	amtString,   		// category or variation
		   	amtString,        	// unit price - required
		   	"1"               	// quantity - required
		);

		pageTracker._trackTrans(); //submits transaction to the Analytics servers
	} catch(err) { };

}

var latestVersion = "2.14.3.28";
var installedVer = "null";
function initUpdatePage(){
	$("#latest-version").text(latestVersion);
	
	if($("#installed-version")){
		
		if(document.getElementById("extension-is-installed")) {
			installedVer = $("#extension-is-installed").text();		
		} else {
			installedVer = " detecting...";
		}
		if(installedVer >= latestVersion && installedVer != " detecting..."){
			$("#installed-version").css("color","green");
		}
		$("#installed-version").html(installedVer);
	}

	setTimeout(function(){
		if($("#installed-version").text() == " detecting...")
			$("#installed-version").html(" not detected.");
	},3000);
}


function getAmazonSignature(val){
	var sigFound="";
	for(var i=0; i<amazonSigs.length; i++){
		if(amazonSigs[i].val == val) {
			sigFound = amazonSigs[i].sig; 
		}
	}
	return sigFound;
}

var amazonSigs = [	
	{val:5,   sig:"OXLVvkGU6irf2SmNmSNDlcHCenvbP+XvgwQ07jXIHis="},
	{val:10,  sig:"CEUMmK1su7e8r+A2/fh1I9e8MQLwE3vsV84rr/ZI05M="},
	{val:15,  sig:"B+7EXUzfcX2q9xyGvild0LYM2N/3ns0fZBA3mzWSryg="},
	{val:20,  sig:"S94A88EWq0WP31dhpWvC7IPq8mY0lJAkkUPF/KFna7E="},
	{val:25,  sig:"S94A88EWq0WP31dhpWvC7IPq8mY0lJAkkUPF/KFna7E="},
	{val:30,  sig:"RUWCocyAtk3Oc4L0noEX6A6elBEfMQqagjNJDUGSRXg="},
	{val:35,  sig:"U0O2GcynXkvGMIsq5FCzDCmi4ku/eJlB+anBt5Qo6gs="},
	{val:40,  sig:"HdvXfsj5/xKOavpWO71BaRE4/v/VaqCug6OTR6mQFj8="},
	{val:45,  sig:"oib1586K71CZsHgb26TAGjJsvverNv4TEsGs1D78Tgk="},
	{val:50,  sig:"kBX9dlBodg3BgB8Bc9R4/3riejE2BfTcnY81kVixZns="},
	{val:55,  sig:"30JpuQnqyUnVpMUxwcHFbALfxIDT0XN119I7iiTuGws="},
	{val:60,  sig:"To2gJLdA7+vfDJhVdeD8pz0rwpXqx7O6j7YGaL9l9Ek="},
	{val:65,  sig:"4iEglqu6csP1CcNZavztfRfx9Lk4qRnjADeWKAJrLMU="},
	{val:70,  sig:"7UbMLNbdIksS5Iq9DQKRa5E574phX8ycH1evfeF1wQw="},
	{val:75,  sig:"6pCQaneM7jGsNxmVwZpSMUyZRE81ij/49m0u63yHGSI="},
	{val:80,  sig:"Nur1ljUB2abSeXYDN7LbLpPGm971CoMov235/5XxuBQ="},
	{val:85,  sig:"PR5mWJNIA6x26jCdBpWZd3gdlAmUT79DAdSOA+LTNYg="},
	{val:90,  sig:"NEo/Tg41LZ1RWulBLSXFaLUf+532mLu9gyQdgAtNqNk="},
	{val:95,  sig:"eOYIucUS9NgaKGG8eBzcklwf+25Iteif7qVjaTrOFdY="},
	{val:100, sig:"brGx0BwSGKvWykRvreDf5gN0gVXnumoX8e0Mr9w3NyY="},
	{val:105, sig:"4Qc8e98zjyaKgJTCS8SZQF83LwXqZBOyLzp97SlxuD8="},
	{val:110, sig:"Swry3CkQH7KhgM3doavt0LQcmtW9WEuZC4WEnxbN5rA="},
	{val:115, sig:"PRsvSyHzOqWqqRPDx2QUGXAphgz5Rv4C76bpZo4eDL4="},
	{val:120, sig:"otrNYAtdUFmyo6gV68H3cNOfDJUR/wyIxV4tpmG11NE="},
	{val:125, sig:"Mpxy3gEyT+ofW/JZp1/djUlXHUQf/JDh0RUgXZFC9BY="},
	{val:130, sig:"0rX7NFmktjNsYckNRcEVRCSmNHw/t0XX0tlwrfkBJvY="},
	{val:135, sig:"JwDGLqbjRoNRynVTv4z9rcKHzkMgv3GfpweQCZCYVf0="},
	{val:140, sig:"hIAsc47XcNCrO5o0kFDIoEDqpQXu2JLmhaaQmFZpzzg="},
	{val:145, sig:"Q1O4PuI8hbUAld12KeNA7CmsE/NsbMq0917bXREi5aM="},
	{val:150, sig:"JXv3E0XPimyXiZQ9y4LKtJ5PzV3wHfGv6eTh7Gh8GjQ="},
	{val:155, sig:"t8LCuDOuUBu+GoaAcbDdtwh5dXlfax4t8ICQoyTggvU="},
	{val:160, sig:"6kQxyfGogEFX2kxytbs6SljQfd6gBE9jgnKJ2azwIoU="},
	{val:165, sig:"rn7bRoaNZqMkyfoNuTApIFcNWh3Bvd3D2HsPLHY5Zgc="},
	{val:170, sig:"AZ5wG80iH4kbga0ePKGydt7r7xzJPIu3lo32KEelmbk="},
	{val:175, sig:"w5CctTttGSH3SIcuCLWmYUabQbejx/vbkohZjUkcEqQ="},
	{val:180, sig:"5nuAMRPCrDCe+gWYif8z/FO4RexzXjXCtW9ac9N52Ws="},
	{val:185, sig:"LMljxIS6+NPoMqIAhVEKUQLSNRdFybjGcxsNA4/x74E="},
	{val:190, sig:"W8v6ZBcs272sfpYVYdnBx7wU1IuVuZHlG3tWPmW2ETg="},
	{val:195, sig:"7ZKhdGaI24qiN/imM1mzSTrM7uqCgYOs/uKH0Eb+nnI="},
	{val:200, sig:"zj9Br/5wu4qLPCVeikzfok+Q+Kti988/0e9x6MIUnkI="}
];



function initLeaveTipButton(){
	$("#leaveTipButton").click(function(){

		
		document.body.scrollTop = document.documentElement.scrollTop = $(".secondary_text").offset().top;
	});
};
	


