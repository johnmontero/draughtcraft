$.draughtcraft.recipes.builder._delay = (function(){
  var timer = 0;
  return function(callback, ms){
    $.draughtcraft.recipes.builder._changes_in_queue = ms != 0;
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

$.draughtcraft.recipes.builder._first_focus = true;
$.draughtcraft.recipes.builder._changes_in_queue = false;

/*
 * Used to fetch and redraw the current recipe via AJAX.
 */
$.draughtcraft.recipes.builder.fetchRecipe = function(){
    $.ajax({
        url: window.location.pathname+'/async/ingredients',
        cache: false,
        success: function(html){
            $.draughtcraft.recipes.builder.__injectRecipeContent__(html);
        }
    });
};

/*
 * Copies the inventory lists into the injected AJAX builder content.
 */
$.draughtcraft.recipes.builder.injectInventories = function(){
    $('#inventories > div').each(function(){
        var type = this.className;
        $('.inventory.'+type).html($(this).html());
    });
};

/*
 * After builder content is fetched, inject it into the appropriate
 * container.
 * @param {String} html - The HTML content to inject
 */
$.draughtcraft.recipes.builder.__injectRecipeContent__ = function(html){

    //
    // For performance reasons, we should clean up all previously 
    // rendered jQuery select widgets.
    //
    $(".step fieldset select").selectBox('destroy');

    //
    // Look for tr.addition in the DOM
    // and keep track of all unique DOM ID's.
    //
    var before = $.map($('tr.addition[id]'), function(x){
        return $(x).attr('id');
    });

    $("#builder-ajax").html(html);

    $.draughtcraft.recipes.builder.handleAnchor();

    //
    // Look for tr.additions that didn't exist *before* content injection.
    //
    var after = $.map($('tr.addition[id]'), function(x){
        return $(x).attr('id');
    });
    var difference = after.filter(function(i){
        return before.indexOf(i) < 0;
    });

    //
    // Visually stripe the recipe ingredients
    // 
    $('tr.addition').each(function(index){
        if(index % 2 == 0)
            $(this).addClass('even');
    });

    $.draughtcraft.recipes.builder.__afterRecipeInject();

    //
    // If a new row exists, focus on its first form element.
    //
    if($.draughtcraft.recipes.builder._first_focus)
        $.draughtcraft.recipes.builder._first_focus = false;
    else if(difference.length){
        $('#'+difference[0]).find('input, select').eq(0).focus();
    }

};

/*
 * After recipe content is injected into the builder container, there are a
 * variety of listeners and state settings (e.g., current tab, last 
 * focused field) we need to persist.
 */
$.draughtcraft.recipes.builder.__afterRecipeInject = function(){

    // Re-initialize all event listeners
    $.draughtcraft.recipes.builder.injectInventories();
    $.draughtcraft.recipes.builder.initListeners();

    // Re-choose the "last chosen" tab
    $.draughtcraft.recipes.builder.selectTab(
        $.draughtcraft.recipes.builder.currentTab 
    );

    //
    // Initialize forms in the newly replaced DOM with Ajax versions
    // On successful Ajax submission, we inject the response body into
    // the DOM.
    //
    $('#builder form:not(.name)').each(function(){
        $(this).ajaxForm({
            'success' : $.proxy(function(responseText){
                $('.publish-btn').prop('disabled', false);
                $('.publish-btn').text('Publish Changes');
                $.draughtcraft.recipes.builder._delay($.noop, 0);
                if(!$(this).hasClass('no-inject'))
                    $.draughtcraft.recipes.builder.__injectRecipeContent__(responseText);
                $.draughtcraft.recipes.builder._changes_in_queue = false;
            }, this),
            'error' : $.proxy(function(jqXHR, textStatus, errorThrown){
                $('.publish-btn').prop('disabled', false);
                $('.publish-btn').text('Publish Changes');
                $.draughtcraft.recipes.builder._delay($.noop, 0);
                if(!$(this).hasClass('no-inject'))
                    $.draughtcraft.recipes.builder.__injectRecipeContent__(jqXHR.responseText);
                $.draughtcraft.recipes.builder._changes_in_queue = false;
            }, this)
        });
    });

    //
    // As the user is changing values, we're instantly pushing data to a
    // controller, and redrawing the editing UI again.
    //
    // If the user is moving between fields using tab or the mouse,
    // we might potentially overwrite the DOM element that they're
    // focused on, so we need to do our best to maintain the currently
    // focused field.
    //
    if($.draughtcraft.recipes.builder.lastFocus){
        var n = $.draughtcraft.recipes.builder.lastFocus;
        $('input#'+n+', select#'+n+', textarea#'+n).focus();
    }

    //
    // If error messages are embedded on the page,
    // pull them from the DOM and apply the error messages as "title"
    // attributes on the appropriate elements.
    //
    $('span.error-message').each(function(){
        $(this).prev('input, select, textarea').attr('title', $(this).html()+'.').tipTip({'delay': 200});
        $(this).remove();
    });

    $("#tiptip_holder").fadeOut();

    // Draw jQuery-powered replacements for native <select>'s.
    $(".step fieldset select").selectBox({
        'menuTransition'    : 'fade',
        'menuSpeed'         : 'fast'
    });

    // Register tooltips for the recipe actions
    $('div#actions li').each(function(){
        $(this).tipTip({
            'delay'     : 25,
            'edgeOffset': 20
        });
    });

    // Register tooltips for each of the `results` settings buttons
    $('div.results a.recipe-setting img').each(function(){
        $(this).tipTip({
            'delay'     : 25,
            'edgeOffset': 20,
            'content'   : $(this).closest('a').attr('title')
        });
        $(this).closest('a').removeAttr('title');
    });

    // Register fancybox popups for ingredient links
    $("a[href^='/ingredients/']").fancybox();

    // Hide unnecessary verbiage helpers
    $('h3 span.step-help').remove();
};

$.draughtcraft.recipes.builder.currentTab = 0;
/*
 * Initializes listeners for the "tabs" (e.g.,
 * Mash, Boil, Ferment...)
 */
$.draughtcraft.recipes.builder.initTabs = function(){
    $('.step h2 li a').click(function(e){
        // Determine the index of the chosen tab
        var index = $('.step.active h2 li a').index(this);

        // Actually choose the tab
        $.draughtcraft.recipes.builder.selectTab(index);
    });
};

// The DOM ID of the last focused form field
$.draughtcraft.recipes.builder.lastFocus;

/*
 * Initialize event listeners for input field focus/blur
 * so that we can keep track of the "last focused field".
 */
$.draughtcraft.recipes.builder.initFocusListeners = function(){
    // When a field gains focus, store its id.
    var fields = $('input, select, textarea'); 
    fields.focus(function(){
        $.draughtcraft.recipes.builder.lastFocus = $(this).attr('id');
    });
    // When a field loses focus, unset its id.
    fields.blur(function(){
        if($(this).attr('id') && $.draughtcraft.recipes.builder.lastFocus == $(this).attr('id'))
            $.draughtcraft.recipes.builder.lastFocus = null;
    });
};

/*
 * Initializes event listeners for input field changes
 * for recipe components.
 */
$.draughtcraft.recipes.builder.initUpdateListeners = function(){

    //
    // For each text input, monitor the keyup event.
    //
    // If more than 2s passes since the last keyup, submit the changed
    // form value asynchronously.
    //
    var save = function(){
        // Stop listening for mouse movements...
        $('body').unbind('mousemove');

        // Clear any previously queued form submissions
        $.draughtcraft.recipes.builder._delay($.noop, 0);
        
        // Remove any input field `blur` listeners
        $(this).unbind('blur');

        // Find the closest form to submit
        var form = $(this).closest('form');

        // Actually submit the form.
        form.submit();

        // Temporarily disable the publish button
        $('.publish-btn').prop('disabled', true);
        $('.publish-btn').text('Saving Changes...');

        //
        // Find any adjacent input fields (for the form) and temporarily
        // disable them (disallow edits while saving) for the duration
        // of the Ajax save.
        //
        if(!$(form).hasClass('no-inject')){
            $(form).find('input, select').prop('disabled', true);
            $(".step fieldset select").selectBox('disable');
        }
    };

    // Any time an <input> or <textarea> triggers a `keyup`...
    $('.step input, .step textarea, .results textarea').keyup(function(e){
        // Ignore Tab or Shift-Tab keypresses...
        if(e.keyCode == 9 || e.keyCode == 16) return;

        // Start a timer to auto-save soon.
        $.draughtcraft.recipes.builder._delay($.proxy(save, this), 500);

        //
        // Listen for any mouse movement. If movement occurs, go ahead and save.
        // This usually signals that the user is moving their mouse to add
        // another ingredient or change some setting.
        //
        $('body').mousemove($.proxy(function(){
            // Stop listening for mouse movements...
            $('body').unbind('mousemove');
            $.draughtcraft.recipes.builder._delay($.proxy(save, this), 250);
        }, this));

    });

    //
    // If any field receives focus, cancel any queued saves and let the changes
    // get rolled into the next save attempt.
    //
    // In this way, if a user tabs from field to field, editing along the way,
    // the changes will be saved in bulk once:
    //
    // 1.  They move their mouse.
    //            - or -
    // 2.  They change a value and wait past the auto-save threshold.
    //
    $('.step input, .step select').focus(function(){
        if(!$.draughtcraft.recipes.builder._changes_in_queue) return;
        if($(this).hasClass('selectBox')) return;
        $.draughtcraft.recipes.builder._delay($.noop, 0);
    });

    //
    // If we're *about* to save, and any field is *hovered over*, prolong
    // the save for an additional second.  In this way, if the user
    // is moving the mouse around after changing a field value, it won't
    // save (and disable some field they're about to potentially focus on).
    //
    $('.step input, .step select').mouseenter(function(){
        if($.draughtcraft.recipes.builder._changes_in_queue){
            $.draughtcraft.recipes.builder._delay($.proxy(save, this), 1000);
        }
    });

    // Any time a <select>'s value changes, save immediately.
    $('.step select').change(save);
};

/*
 * To enhance user experience, we should automatically
 * add sequentual `tabindex` attributes to the ingredient
 * editing fields.  This will make it so that users can
 * easily tab through form fields as they're live-editing.
 */
$.draughtcraft.recipes.builder.initTabIndexes = function(){

    $('.step input, .step select').each(function(index){
        $(this).attr('tabindex', index);
    });

    //
    // Links should have the lowest possible tab precedence - while
    // you're tabbing through the ingredient editing form,
    // we don't want to stop on links to ingredients, but instead
    // want to move easily from field to field.
    //
    $('.step tr.addition a').attr('tabindex', "9999");
};

/*
 * Initializes all event listeners
 */
$.draughtcraft.recipes.builder.initListeners = function(){
    $.draughtcraft.recipes.builder.initTabs();
    $.draughtcraft.recipes.builder.initTabIndexes();
    $.draughtcraft.recipes.builder.initUpdateListeners();
    $.draughtcraft.recipes.builder.initFocusListeners();
};

/*
 * Used to remove an addition/ingredient from a recipe.
 * @param {Integer} model.RecipeAddition.id
 */
$.draughtcraft.recipes.builder.removeAddition = function(addition, el){
    if(confirm('Are you sure you want to remove this?')){
        $(el).closest('tr').remove();
        $.ajax({
            url: window.location.pathname+'/async/ingredients/'+addition,
            type: 'DELETE',
            cache: false,
            success: function(html){
                $.draughtcraft.recipes.builder.__injectRecipeContent__(html);
            }
        });
    }
};

/*
 * Chooses and displays a specific tab/section.
 * @param {Integer} index
 */
$.draughtcraft.recipes.builder.selectTab = function(index){
    // Hide all steps
    $('.step').removeClass('active');

    // Display the step at the correct index
    $('.step').eq(index).addClass('active');

    // Store the "current" step index for reference
    $.draughtcraft.recipes.builder.currentTab = index;

    // Force the sidebar to scroll down with the page
    $('.inventory:visible').scrollToFixed({ marginTop: 10 });

    // Safari bug: force the browser window to repaint by quickly scrolling
    var pos = $('body').scrollTop();
    window.scrollTo(0, pos+1);
    window.scrollTo(0, pos);
}; 

/*
 * Render jQuery replacements for recipe-level settings,
 * and listen on form submissions.
 */
$.draughtcraft.recipes.builder.initRecipeSettings = function(){
    // Draw jQuery-powered replacements for native <select>'s.
    $("#builder fieldset select").selectBox({
        'menuTransition'    : 'fade',
        'menuSpeed'         : 'fast'
    });
    // For each setting, monitor changes and submit the containing form
    $('#builder fieldset select').change(function(){
        var form = $(this).closest('form');
        form.submit();
    });
};

/*
 * If a specific step is specified in the page anchor
 * (e.g., #mash, #boil), select the appropriate tab.
 */
$.draughtcraft.recipes.builder.handleAnchor = function(){
    var anchor = window.location.hash;
    if(anchor){
        var tab = $('li.active a[href$='+anchor+']').closest('.step');
        $.draughtcraft.recipes.builder.selectTab($('.step').index(tab));
    }
};

/*
 * Register tooltip listeners on the name field, and cause it to autogrow
 * as text is added and removed.
 */
$.draughtcraft.recipes.builder.handleNameField = function(){
    var msg = 'Click here to edit the recipe name.';
    $('h1').tipTip({
        'delay'     : 50,
        'content'   : msg
    });
    $('h1 input').focus(function(){
        $('h1').tipTip('hide').tipTip('destroy');
    }).blur(function(){
        $('h1').tipTip({
            'delay'     : 50,
            'content'   : msg
        })
    }).autogrow({
        'minWidth'      : 150,
        'maxWidth'      : 535,
        'comfortZone'   : 25
    }).change(function(){
        $(this).closest('form').submit();   
    });

    /*
     * When the name field is changed, submit its containing form via ajax.
     */
    $('#builder div.header > form.name').ajaxForm({
        'success' : function(responseText){
            $('.publish-btn').prop('disabled', false);
            $('.publish-btn').text('Publish Changes');
            $.draughtcraft.recipes.builder._delay($.noop, 0);
            $.draughtcraft.recipes.builder._changes_in_queue = false;
        },
        'error' : function(jqXHR, textStatus, errorThrown){
            $('.publish-btn').prop('disabled', false);
            $('.publish-btn').text('Publish Changes');
            $.draughtcraft.recipes.builder._delay($.noop, 0);
            $.draughtcraft.recipes.builder._changes_in_queue = false;
        }
    });
};

/*
 * Register form listeners on the volume field
 */
$.draughtcraft.recipes.builder.handleVolumeField = function(){
    /*
     * When the volume field is changed, submit its containing form via ajax.
     */
    $('#builder div.header form.volume input').keyup(function(){
        // Start a timer to auto-save 2 seconds from now.
        $.draughtcraft.recipes.builder._delay($.proxy(function(){

            var value = $(this).val();
            if(!parseFloat(value) || isNaN(parseFloat(value))){
                $(this).val(this.defaultValue);
                return;
            }
            this.defaultValue = value;

            // Temporarily disable the publish button
            $('.publish-btn').prop('disabled', true);
            $('.publish-btn').text('Saving Changes...');

            $(this).closest('form').submit();  
            
        }, this), 1000);
    });
};

(function($){

    $.fn.autogrow = function(o) {

        o = $.extend({
            maxWidth: 1000,
            minWidth: 0,
            comfortZone: 70
        }, o);

        this.filter('input:text').each(function(){

            var minWidth = o.minWidth || $(this).width(),
                val = '',
                input = $(this),
                testSubject = $('<tester/>').css({
                    position: 'absolute',
                    top: -9999,
                    left: -9999,
                    width: 'auto',
                    fontSize: input.css('fontSize'),
                    fontFamily: input.css('fontFamily'),
                    fontWeight: input.css('fontWeight'),
                    letterSpacing: input.css('letterSpacing'),
                    whiteSpace: 'nowrap'
                }),
                check = function() {

                    if (val === (val = input.val())) {return;}

                    // Enter new content into testSubject
                    var escaped = val.replace(/&/g, '&amp;').replace(/\s/g,'&nbsp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    testSubject.html(escaped);

                    // Calculate new width + whether to change
                    var testerWidth = testSubject.width(),
                        newWidth = (testerWidth + o.comfortZone) >= minWidth ? testerWidth + o.comfortZone : minWidth,
                        currentWidth = input.width(),
                        isValidWidthChange = (newWidth < currentWidth && newWidth >= minWidth)
                                             || (newWidth > minWidth && newWidth < o.maxWidth);

                    // Animate width
                    if (isValidWidthChange) {
                        input.width(newWidth);
                    }

                };

            testSubject.insertAfter(input);

            $(this).bind('keyup keydown blur update', check);
            check();

        });

        return this;

    };

})(jQuery);

$(document).ready(function(){
    $.draughtcraft.recipes.builder.initRecipeSettings();
    $.draughtcraft.recipes.builder.fetchRecipe();
    $.draughtcraft.recipes.builder.handleNameField();
    $.draughtcraft.recipes.builder.handleVolumeField();

    // Register a JS tooltip on the author's thumbnail (if there is one).
    $('img.gravatar').tipTip({'delay': 50});
});

// Disabling Safari's annoying form warning - the builder auto-saves for you.
window.onbeforeunload=function(e){}
