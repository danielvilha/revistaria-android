function Revista(_data) {
	
	var Page = require('ViewPageLoop');
	var Nav = require('Nav');

	var self = Ti.UI.createWindow({
		backgroundColor : '#000',
		width : 'auto',
		fullscreen : true,
		navBarHidden : true
	});

	self.postlayout = false;
	self.orientationModes = [Titanium.UI.PORTRAIT];

	self.addEventListener('postlayout', function(e) {
		if (!self.postlayout) {
			self.postlayout = true;
			self.init();
		}

	});

	self.init = function() {
		var currentPage;
		var data = [];
		var path = "";

		var dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, _data.editionId + Ti.Filesystem.separator + "files");
		path = dir.resolve();
		var file = Titanium.Filesystem.getFile(path, "data.txt");

		if (file.exists()) {
			var json = file.read();
			var d = JSON.parse(json);
			json = null;
			data = d.pages;
		} else {
			Ti.API.info("Arquivo não existe");
		}
		dir = null;
		file = null;

		var pages = [];

		for (var i = 0; i < data.length; i++) {
			data[i].index = i;
			var page = new Page(data[i], path);
			page.addEventListener('page:swipe', function(e) {

				if (e.direction == 'right') {
					scrollableView.moveNext();
				} else if (e.direction == 'left') {
					scrollableView.movePrevious();
				}
			});
			page.addEventListener('page:canScroll', function(e) {
				scrollableView.scrollingEnabled = e.scroll;
			});
			page.addEventListener('page:linkPage', function(e) {
				scrollableView.scrollToView(parseInt(e.value));

			});
			page.addEventListener('page:singletap', function(e) {
				if (nav.visible) {
					nav.visible = false;
					self.navBarHidden = false;
				} else {
					nav.visible = true;
					self.navBarHidden = true;
				}
			});
			pages.push(page);
		}

		var scrollableView = Ti.UI.createScrollableView({
			width : "auto",
			height : "auto",
			maxZoomScale : 3,
			minZoomScale : 1,
			zoomScale : 1,
			scrollingEnabled : true
		});

		scrollableView.views = pages;

		var nav = new Nav(data, self.rect, path);

		scrollableView.addEventListener('scrollEnd', function(e) {
			scrollableView.scrollingEnabled = e.view.canScroll;
			var i = e.currentPage;
			currentPage = scrollableView.views[i];

			for (var v = 0; v < scrollableView.views.length; v++) {
				if (v != i) {
					var p = scrollableView.views[v];
					if (!p.canScroll)
						p.fitPage();
				}
			}

			nav.goTo(i);
		});

		self.loop = -1;
		self.closed = false;
		self.initialized = false;

		scrollableView.addEventListener('postlayout', function(e) {
			if (self.initialized)
				return;
			pageUpdate();
			currentPage = scrollableView.views[0];

			self.initialized = true;
			Ti.API.info(self.loop + "  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> initialized");
		});

		function pageUpdate() {
			if (!self.closed) {
				self.loop = setTimeout(pageUpdate, 50);
			} else {
				clearTimeout(self.loop);
			}

			if (currentPage == null)
				return;

			try {
				currentPage.update();
			} catch(err) {
			}
		}

		function lag(e) {
			scrollableView.scrollingEnabled = e;
		}

		nav.addEventListener('nav:thumbClick', function(e) {
			scrollableView.scrollToView(e.index);
		});

		self.fechar = function() {
			Ti.API.info(self.loop + "fechar >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
			clearTimeout(self.loop);
			self.loop = null;
			self.closed = true;
			for (var v = 0; v < pages.length; v++) {
				pages[v] = null;
			}

			self.remove(scrollableView);
			self.remove(nav);
			scrollableView = null;
			nav = null;
			pages = [];
			pages = null;
			currentPage = null;
			data = null;
		}

		self.add(scrollableView);

		self.add(nav);
	};

	return self;
}

//make constructor function the public component interface
module.exports = Revista;