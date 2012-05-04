/*\
title: $:/core/modules/macros/slider.js
type: application/javascript
module-type: macro

!Introduction
The slider macro is used to selectively reveal a chunk of text. By default, it renders as a button that may be clicked or touched to reveal the enclosed text.

The enclosed text can be a string of WikiText or be taken from a target tiddler.

The current state of the slider can be stored as the string "open" or "closed" in a specified tiddler. If the value of that tiddler changes then the slider is automatically updated. If no state tiddler is specified then the state of the slider isn't retained, but the slider still works as expected.
!!Parameters
|`state` //(defaults to 1st parameter)// |The title of the tiddler to contain the current state of the slider |
|`default` |The initial state of the slider, either `open` or `closed` |
|`class` |A CSS class to be applied to the slider root element |
|`content` |The WikiText to be enclosed in the slider. Overrides the `target` parameter, if present |
|`target` //(defaults to 2nd parameter)// |The title of the tiddler that contains the enclosed text. Ignored if the `content` parameter is specified |
|`label` //(defaults to 3rd parameter)// |The plain text to be displayed as the label for the slider button |
|`tooltip` //(defaults to 4th parameter)// |The plain text tooltip to be displayed when the mouse hovers over the slider button |
!!Markup
The markup generated by the slider macro is:
{{{
	<span class="tw-slider {user defined class}">
		<a class="btn-info">{slider label}</a>
		<div class="tw-slider-body" style="display:{state}">{slider content}</div>
	</span>
}}}
!!Examples
A minimal slider:
{{{
<<slider target:MyTiddler>>
}}}
!!Notes
The slider is a good study example of a simple interactive macro.
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "slider",
	params: {
		state: {byPos: 0, type: "tiddler"},
		target: {byPos: 1, type: "tiddler"},
		label: {byPos: 2, type: "text"},
		tooltip: {byPos: 3, type: "text"},
		"default": {byName: true, type: "text"},
		"class": {byName: true, type: "text"},
		content: {byName: true, type: "text"}
	},
	events: ["click"]
};

exports.getOpenState = function() {
	if(this.hasParameter("state")) {
		var stateTiddler = this.wiki.getTiddler(this.params.state);
		if(stateTiddler) {
			return stateTiddler.fields.text.trim() === "open";
		}
	}
	if(this.hasParameter("default")) {
		return this.params["default"] === "open";
	}
	return false;
};

exports.saveOpenState = function() {
	if(this.hasParameter("state")) {
		var stateTiddler = this.wiki.getTiddler(this.params.state) || {title: this.params.state, text: ""};
		this.wiki.addTiddler(new $tw.Tiddler(stateTiddler,{text: this.isOpen ? "open" : "closed"}));
		return true;
	}
	return false;
};

exports.getSliderChildren = function() {
	if(this.hasParameter("content")) {
		return this.wiki.parseText("text/x-tiddlywiki",this.params.content).tree;
	} else if(this.hasParameter("target")) {
		return [$tw.Tree.Macro(
					"tiddler",
					{target: this.params.target},
					null,
					this.wiki)];
	} else {
		return [$tw.Tree.errorNode("No content specified for slider")];
	}
};

exports.handleEvent = function(event) {
	switch(event.type) {
		case "click": 
			if(event.target === this.domNode.firstChild.firstChild) {
				this.isOpen = !this.isOpen;
				if(!this.saveOpenState()) {
					this.refreshInDom({});
				}
				event.preventDefault();
				return false;
			} else {
				return true;	
			}
	}
	return true;
};

exports.executeMacro = function() {
	this.isOpen = this.getOpenState();
	var sliderChildren = [];
	if(this.isOpen) {
		sliderChildren = this.getSliderChildren();
	}
	var attributes = {
		"class": ["tw-slider"]
	};
	if(this.hasParameter("class")) {
		attributes["class"].push(this.params["class"]);
	}
	if(this.hasParameter("state")) {
		attributes["data-tw-slider-type"] = this.params.state;
	}
	if(this.hasParameter("tooltip")) {
		attributes.alt = this.params.tooltip;
		attributes.title = this.params.tooltip;
	}
	var children = $tw.Tree.Element("span",
		attributes,
		[
			$tw.Tree.Element("a",
				{
					"class": ["btn","btn-info"]
				},[
					$tw.Tree.Text(this.params.label ? this.params.label : this.params.target)
				]
			),
			$tw.Tree.Element("div",
				{
					"class": ["tw-slider-body"],
					"style": {"display": this.isOpen ? "block" : "none"}
				},
				sliderChildren
			)
		]
	);
	children.execute(this.parents,this.tiddlerTitle);
	return [children];
};

exports.refreshInDom = function(changes) {
	var needChildrenRefresh = true; // Avoid refreshing the children nodes if we don't need to
	// If the state tiddler has changed then reset the open state
	if(this.hasParameter("state") && changes.hasOwnProperty(this.params.state)) {
		this.isOpen = this.getOpenState();
	}
	// Render the children if the slider is open and we don't have any children yet
	if(this.isOpen && this.children[0].children[1].children.length === 0) {
		// Remove the existing dom node for the body
		this.children[0].domNode.removeChild(this.children[0].children[1].domNode);
		// Get the slider children and execute it
		this.children[0].children[1].children = this.getSliderChildren();
		this.children[0].children[1].execute(this.parents,this.tiddlerTitle);
		this.children[0].children[1].renderInDom(this.children[0].domNode,null);
		needChildrenRefresh = false; // Don't refresh the children if we've just created them
	}
	// Set the visibility of the slider children
	this.children[0].children[1].domNode.style.display = this.isOpen ? "block" : "none";
	// Refresh any children
	if(needChildrenRefresh) {
		for(var t=0; t<this.children.length; t++) {
			this.children[t].refreshInDom(changes);
		}
	}
};

})();
