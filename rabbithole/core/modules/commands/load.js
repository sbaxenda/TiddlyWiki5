/*\
title: $:/core/modules/commands/load.js
type: application/javascript
module-type: command

Load tiddlers command

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "load",
	synchronous: false
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this,
		fs = require("fs"),
		path = require("path");
	if(this.params.length < 1) {
		return "Missing filename";
	}
	fs.readFile(this.params[0],"utf8",function(err,data) {
		if(err) {
			self.callback(err);
		} else {
			var fields = {title: self.params[0]},
				extname = path.extname(self.params[0]),
				type = extname === ".html" ? "application/x-tiddlywiki" : extname;
			var tiddlers = self.commander.wiki.deserializeTiddlers(type,data,fields);
			if(!tiddlers) {
				self.callback("No tiddlers found in file \"" + self.params[0] + "\"");
			} else {
				for(var t=0; t<tiddlers.length; t++) {
					self.commander.wiki.addTiddler(new $tw.Tiddler(tiddlers[t]));
				}
				self.callback(null);	
			}
		}
	});
	return null;
};

exports.Command = Command;

})();
